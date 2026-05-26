import { Router, type Request, type Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { sendPushToUser, fcmEnabled, probeFcmConfig } from '../lib/fcm.js';

export const pushRouter = Router();

// ── POST /api/push/token ──────────────────────────────────────────────────
// Called by the Android shell (via the web app) once Firebase hands us a
// device token. Upserts on `token` so reinstalls / token rotations don't
// pile up duplicate rows.
// Body: { userId, token, platform }
pushRouter.post('/token', async (req: Request, res: Response) => {
  const { userId, token, platform } = req.body as {
    userId?: string;
    token?: string;
    platform?: string;
  };

  if (!userId || !token || !platform) {
    return res.status(400).json({ error: 'userId, token, platform required' });
  }
  if (!['android', 'ios', 'web'].includes(platform)) {
    return res.status(400).json({ error: 'invalid platform' });
  }

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, platform, last_seen_at: now },
      { onConflict: 'token' },
    );

  if (error) {
    console.error('[Push] register failed:', error.message);
    return res.status(500).json({ error: error.message });
  }
  console.log(`[Push] registered token for user ${userId} (${platform})`);
  res.json({ ok: true });
});

// ── DELETE /api/push/token ────────────────────────────────────────────────
// Called on sign-out so the device stops getting pushes for the previous
// account.
// Body: { token }
pushRouter.delete('/token', async (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };
  if (!token) return res.status(400).json({ error: 'token required' });

  const { error } = await supabaseAdmin.from('push_tokens').delete().eq('token', token);
  if (error) {
    console.error('[Push] delete failed:', error.message);
    return res.status(500).json({ error: error.message });
  }
  res.json({ ok: true });
});

// ── POST /api/push ────────────────────────────────────────────────────────
// Same shape as POST /api/email — called by the client right after writing
// a Supabase `notifications` row. Fans the push out to every token
// registered for `userId`. Best-effort: always returns 200.
// Body: { userId, type, title, body, appUrl?, refId? }
pushRouter.post('/', async (req: Request, res: Response) => {
  const reqId = Math.random().toString(36).slice(2, 8);

  if (!fcmEnabled()) {
    return res.json({ ok: true, skipped: true, reason: 'FCM not configured' });
  }

  const { userId, type, title, body, appUrl, refId } = req.body as {
    userId?: string;
    type?: string;
    title?: string;
    body?: string;
    appUrl?: string;
    refId?: string;
  };

  if (!userId || !title || !body) {
    return res.status(400).json({ error: 'userId, title, body required' });
  }

  // Pick a deep-link path based on type so a tap lands on the right page.
  const route =
    type === 'dm' || type === 'message' ? '/messages' :
    type === 'booking'                   ? '/messages' :
    type === 'new_application'           ? '/dashboard' :
    type === 'new_listing' || type === 'new_job' ? '/internships' :
    '/dashboard';

  console.log(`[Push][${reqId}] fan-out user=${userId} type=${type} title="${title}"`);

  try {
    const result = await sendPushToUser(userId, {
      title,
      body,
      data: {
        type: type ?? 'notification',
        route,
        ...(refId ? { refId } : {}),
        ...(appUrl ? { appUrl } : {}),
      },
    });
    console.log(
      `[Push][${reqId}] attempted=${result.attempted} delivered=${result.delivered} ` +
      `pruned=${result.pruned} errors=${result.errors.length}`,
    );
    if (result.errors.length > 0) {
      console.warn(`[Push][${reqId}] errors:`, result.errors.slice(0, 3));
    }
    res.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[Push][${reqId}] failed:`, msg);
    res.json({ ok: false, error: msg });
  }
});

// ── POST /api/push/bulk ───────────────────────────────────────────────────
// Fan a single notification out to many users at once. Used when a company
// posts a listing — we want every follower to get the push without the
// client making N round-trips. Best-effort, always returns 200.
// Body: { userIds: string[], type, title, body, appUrl?, refId? }
pushRouter.post('/bulk', async (req: Request, res: Response) => {
  const reqId = Math.random().toString(36).slice(2, 8);

  if (!fcmEnabled()) {
    return res.json({ ok: true, skipped: true, reason: 'FCM not configured' });
  }

  const { userIds, type, title, body, appUrl, refId } = req.body as {
    userIds?: string[];
    type?: string;
    title?: string;
    body?: string;
    appUrl?: string;
    refId?: string;
  };

  if (!Array.isArray(userIds) || userIds.length === 0 || !title || !body) {
    return res.status(400).json({ error: 'userIds[], title, body required' });
  }

  // Cap fanout per request so a single call can't trigger thousands of
  // pushes. Callers can chunk if they really need more.
  const ids = userIds.filter((u) => typeof u === 'string' && u.length > 0).slice(0, 500);

  const route =
    type === 'dm' || type === 'message' ? '/messages' :
    type === 'booking'                   ? '/messages' :
    type === 'new_application'           ? '/dashboard' :
    type === 'new_listing' || type === 'new_job' || type === 'followed_company_listing' ? '/internships' :
    '/dashboard';

  console.log(`[Push][${reqId}] bulk fan-out users=${ids.length} type=${type} title="${title}"`);

  let attempted = 0, delivered = 0, pruned = 0;
  const errors: string[] = [];

  // Sequential rather than parallel — each call talks to Supabase + FCM/Web
  // Push and we don't want to spike rate limits with a 500-wide burst.
  for (const userId of ids) {
    try {
      const result = await sendPushToUser(userId, {
        title,
        body,
        data: {
          type: type ?? 'notification',
          route,
          ...(refId ? { refId } : {}),
          ...(appUrl ? { appUrl } : {}),
        },
      });
      attempted += result.attempted;
      delivered += result.delivered;
      pruned    += result.pruned;
      if (result.errors.length) errors.push(...result.errors.slice(0, 2));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  console.log(
    `[Push][${reqId}] bulk done attempted=${attempted} delivered=${delivered} pruned=${pruned} errs=${errors.length}`,
  );
  res.json({ ok: true, users: ids.length, attempted, delivered, pruned, errors: errors.slice(0, 5) });
});

// ── GET /api/push/diag ────────────────────────────────────────────────────
// Walks the full token-mint path so the dashboard can confirm FCM is
// actually working (not just configured). Safe to call — no message is sent.
pushRouter.get('/diag', async (_req: Request, res: Response) => {
  const probe = await probeFcmConfig();
  res.json(probe);
});
