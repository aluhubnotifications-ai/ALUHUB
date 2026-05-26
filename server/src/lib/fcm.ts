import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import webpush from 'web-push';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';

// ────────────────────────────────────────────────────────────────────────────
//  Firebase Cloud Messaging — HTTP v1 sender.
//
//  We deliberately do NOT use firebase-admin. The Admin SDK pulls in a
//  large dependency tree and a slow first-call cold start on Render's
//  free tier. The only thing we need from it is:
//   1) sign an OAuth JWT with the service-account RSA key,
//   2) exchange that JWT for a short-lived access token,
//   3) POST a message to fcm.googleapis.com/v1/projects/<id>/messages:send.
//  All three are ~80 lines of Node stdlib code below, no extra deps.
// ────────────────────────────────────────────────────────────────────────────

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri: string;
};

// Tagged result so the caller knows *why* an operation failed. The previous
// shape (returning null on any error) made client-side errors useless —
// every distinct failure showed up as the same generic message.
type Result<T> = { ok: true; value: T } | { ok: false; reason: string };

const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token';

let cachedSa: ServiceAccount | null = null;
let cachedToken: { value: string; expiresAt: number } | null = null;

function loadServiceAccount(): Result<ServiceAccount> {
  if (cachedSa) return { ok: true, value: cachedSa };
  if (!env.FCM_SERVICE_ACCOUNT_PATH) {
    return { ok: false, reason: 'FCM_SERVICE_ACCOUNT_PATH not set' };
  }

  let raw: string;
  try {
    raw = readFileSync(env.FCM_SERVICE_ACCOUNT_PATH, 'utf8');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      reason: `service account file unreadable at ${env.FCM_SERVICE_ACCOUNT_PATH}: ${msg}`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: `service account JSON parse failed: ${msg}` };
  }

  const obj = parsed as Partial<ServiceAccount> | null;
  if (!obj || typeof obj !== 'object') {
    return { ok: false, reason: 'service account JSON is not an object' };
  }
  if (!obj.client_email || !obj.private_key) {
    return {
      ok: false,
      reason: 'service account JSON missing client_email or private_key',
    };
  }

  // PEM keys require real newlines, but some deployment paths
  // (env-var copy-paste, dashboards that double-escape) leave the
  // string with literal "\n" sequences. createSign will throw an
  // opaque "error:1E08010C" if so — normalize before signing.
  const private_key = obj.private_key.includes('\\n')
    ? obj.private_key.replace(/\\n/g, '\n')
    : obj.private_key;

  cachedSa = {
    client_email: obj.client_email,
    private_key,
    token_uri: obj.token_uri || DEFAULT_TOKEN_URI,
  };
  return { ok: true, value: cachedSa };
}

function base64Url(buf: Buffer | string): string {
  return (typeof buf === 'string' ? Buffer.from(buf) : buf)
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken(): Promise<Result<string>> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) {
    return { ok: true, value: cachedToken.value };
  }

  const loaded = loadServiceAccount();
  if (!loaded.ok) return loaded;
  const sa = loaded.value;

  let jwt: string;
  try {
    const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = base64Url(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: sa.token_uri,
        exp: now + 3600,
        iat: now,
      }),
    );
    const signingInput = `${header}.${claim}`;
    const signer = createSign('RSA-SHA256');
    signer.update(signingInput);
    const signature = base64Url(signer.sign(sa.private_key));
    jwt = `${signingInput}.${signature}`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      reason: `JWT signing failed (check private_key PEM formatting): ${msg}`,
    };
  }

  let res: Response;
  let body: string;
  try {
    res = await fetch(sa.token_uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }).toString(),
    });
    body = await res.text();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: `token exchange network error: ${msg}` };
  }

  if (!res.ok) {
    return {
      ok: false,
      reason: `token exchange status=${res.status} body=${body.slice(0, 300)}`,
    };
  }

  let parsed: { access_token?: string; expires_in?: number };
  try {
    parsed = JSON.parse(body);
  } catch {
    return {
      ok: false,
      reason: `token exchange returned non-JSON: ${body.slice(0, 200)}`,
    };
  }
  if (!parsed.access_token) {
    return { ok: false, reason: 'token exchange returned no access_token' };
  }

  cachedToken = {
    value: parsed.access_token,
    expiresAt: now + (parsed.expires_in ?? 3600),
  };
  return { ok: true, value: cachedToken.value };
}

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>; // FCM data values must be strings
};

export type PushResult = {
  attempted: number;
  delivered: number;
  pruned: number;
  errors: string[];
};

/**
 * Sends `payload` to every device token (FCM or Web Push) registered for `userId`.
 * Routes based on platform: web tokens use Web Push API, others use FCM.
 * Returns a tally — never throws.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushResult> {
  const result: PushResult = { attempted: 0, delivered: 0, pruned: 0, errors: [] };

  const { data: rows, error } = await supabaseAdmin
    .from('push_tokens')
    .select('id, token, platform')
    .eq('user_id', userId);

  if (error) {
    result.errors.push(`token lookup failed: ${error.message}`);
    return result;
  }
  if (!rows || rows.length === 0) return result;

  // Separate web and FCM tokens
  const webTokens = rows.filter((r) => r.platform === 'web');
  const fcmTokens = rows.filter((r) => r.platform !== 'web');

  // Send via Web Push
  if (webTokens.length > 0) {
    const webResult = await sendWebPush(webTokens, payload);
    result.attempted += webResult.attempted;
    result.delivered += webResult.delivered;
    result.pruned += webResult.pruned;
    result.errors.push(...webResult.errors);
  }

  // Send via FCM (Android/iOS)
  if (fcmTokens.length > 0) {
    const fcmResult = await sendFcmPush(fcmTokens, payload);
    result.attempted += fcmResult.attempted;
    result.delivered += fcmResult.delivered;
    result.pruned += fcmResult.pruned;
    result.errors.push(...fcmResult.errors);
  }

  return result;
}

// Send to web tokens via Web Push API
async function sendWebPush(
  tokens: Array<{ id: string; token: string }>,
  payload: PushPayload,
): Promise<PushResult> {
  const result: PushResult = { attempted: 0, delivered: 0, pruned: 0, errors: [] };

  if (!env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY) {
    result.errors.push('Web Push VAPID keys not configured');
    return result;
  }

  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

  const deadTokenIds: string[] = [];

  for (const row of tokens) {
    result.attempted++;
    let subscription;
    try {
      subscription = JSON.parse(row.token);
    } catch (e) {
      result.errors.push(`token parse failed: ${String(e)}`);
      deadTokenIds.push(row.id);
      continue;
    }

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      result.delivered++;
    } catch (e) {
      const err = e as any;
      const statusCode = err.statusCode || 0;
      const dead = statusCode === 404 || statusCode === 410; // gone/invalid
      if (dead) deadTokenIds.push(row.id);
      result.errors.push(`web-push failed: status=${statusCode} ${err.message?.slice(0, 100)}`);
    }
  }

  if (deadTokenIds.length > 0) {
    const { error: delErr } = await supabaseAdmin
      .from('push_tokens')
      .delete()
      .in('id', deadTokenIds);
    if (delErr) {
      result.errors.push(`prune failed: ${delErr.message}`);
    } else {
      result.pruned = deadTokenIds.length;
    }
  }

  return result;
}

// Send to FCM tokens (Android/iOS)
async function sendFcmPush(
  tokens: Array<{ id: string; token: string }>,
  payload: PushPayload,
): Promise<PushResult> {
  const result: PushResult = { attempted: 0, delivered: 0, pruned: 0, errors: [] };

  if (!env.FCM_PROJECT_ID) {
    result.errors.push('FCM_PROJECT_ID not set');
    return result;
  }

  const tokenResult = await getAccessToken();
  if (!tokenResult.ok) {
    const msg = `could not mint FCM access token: ${tokenResult.reason}`;
    console.error(`[FCM] ${msg}`);
    result.errors.push(msg);
    return result;
  }
  const accessToken = tokenResult.value;

  const endpoint = `https://fcm.googleapis.com/v1/projects/${env.FCM_PROJECT_ID}/messages:send`;
  const deadTokenIds: string[] = [];

  for (const row of tokens) {
    result.attempted++;
    const message = {
      message: {
        token: row.token,
        notification: { title: payload.title, body: payload.body },
        data: payload.data ?? {},
        android: {
          priority: 'HIGH' as const,
          notification: { channel_id: 'aluhub_default' },
        },
      },
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      const text = await res.text();
      if (res.ok) {
        result.delivered++;
      } else {
        const dead =
          /UNREGISTERED|NOT_FOUND|INVALID_ARGUMENT/.test(text) || res.status === 404;
        if (dead) deadTokenIds.push(row.id);
        result.errors.push(`status=${res.status} body=${text.slice(0, 200)}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push(`fetch failed: ${msg}`);
    }
  }

  if (deadTokenIds.length > 0) {
    const { error: delErr } = await supabaseAdmin
      .from('push_tokens')
      .delete()
      .in('id', deadTokenIds);
    if (delErr) {
      result.errors.push(`prune failed: ${delErr.message}`);
    } else {
      result.pruned = deadTokenIds.length;
    }
  }

  return result;
}

export function fcmEnabled(): boolean {
  return Boolean(env.FCM_PROJECT_ID && env.FCM_SERVICE_ACCOUNT_PATH);
}

/**
 * Boot-time/diag probe. Walks the same code path as a real push but stops
 * after minting the access token, so we can verify the service account is
 * loadable and Google accepts our JWT without sending a message.
 */
export async function probeFcmConfig(): Promise<{
  enabled: boolean;
  projectIdSet: boolean;
  serviceAccountPathSet: boolean;
  serviceAccountLoadable: boolean;
  serviceAccountReason?: string;
  tokenMintable: boolean;
  tokenReason?: string;
}> {
  const projectIdSet = Boolean(env.FCM_PROJECT_ID);
  const serviceAccountPathSet = Boolean(env.FCM_SERVICE_ACCOUNT_PATH);

  // Don't reuse the cached SA — re-read so the probe reflects current state.
  cachedSa = null;
  const loaded = loadServiceAccount();
  if (!loaded.ok) {
    return {
      enabled: fcmEnabled(),
      projectIdSet,
      serviceAccountPathSet,
      serviceAccountLoadable: false,
      serviceAccountReason: loaded.reason,
      tokenMintable: false,
      tokenReason: 'skipped (service account not loadable)',
    };
  }

  // Force a fresh mint so we actually exercise the token exchange.
  cachedToken = null;
  const token = await getAccessToken();
  return {
    enabled: fcmEnabled(),
    projectIdSet,
    serviceAccountPathSet,
    serviceAccountLoadable: true,
    tokenMintable: token.ok,
    tokenReason: token.ok ? undefined : token.reason,
  };
}
