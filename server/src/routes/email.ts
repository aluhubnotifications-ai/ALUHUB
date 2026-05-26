import { Router, type Request, type Response } from 'express';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';

export const emailRouter = Router();

// ── Email templates per notification type ─────────────────────────────────────

type NotifType =
  | 'new_application'
  | 'status_change'
  | 'message'
  | 'dm'
  | 'new_listing'
  | 'new_job'
  | 'payment'
  | 'housing'
  | string;

function buildEmail(type: NotifType, title: string, body: string, appUrl: string) {
  const accent = '#0A2E5C';
  const cta = `<a href="${appUrl}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:${accent};color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Open ALUHub →</a>`;

  const icons: Record<string, string> = {
    new_application: '📋',
    status_change:   '🔔',
    message:         '💬',
    dm:              '💬',
    new_listing:     '💼',
    new_job:         '💼',
    payment:         '✅',
    housing:         '🏠',
    booking:         '📅',
  };
  const icon = icons[type] ?? '🔔';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(10,46,92,.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${accent} 0%,#2563EB 100%);padding:28px 36px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">${icon}</div>
            <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-.02em;">ALUHub</div>
            <div style="font-size:13px;color:rgba(255,255,255,.7);margin-top:4px;">Student Platform for ALU</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#0A2E5C;letter-spacing:-.02em;">${title}</h1>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.65;">${body.replace(/\n/g, '<br/>')}</p>
            ${cta}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f4f6fb;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">You're receiving this because you have an ALUHub account. <br/>
            <a href="${appUrl}/settings" style="color:#6b7280;">Manage notifications</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return html;
}

// ── Send via Brevo transactional email API ────────────────────────────────────

async function sendBrevoEmail(opts: {
  toEmail: string;
  toName: string;
  subject: string;
  html: string;
}): Promise<{ messageId?: string; raw: string }> {
  const payload = {
    sender: { name: env.EMAIL_FROM_NAME, email: env.EMAIL_FROM_ADDR },
    to: [{ email: opts.toEmail, name: opts.toName }],
    subject: opts.subject,
    htmlContent: opts.html,
  };

  console.log('[Email][Brevo] POST https://api.brevo.com/v3/smtp/email');
  console.log(`[Email][Brevo] sender=${env.EMAIL_FROM_ADDR} (${env.EMAIL_FROM_NAME})`);
  console.log(`[Email][Brevo] to=${opts.toEmail} (${opts.toName})`);
  console.log(`[Email][Brevo] subject="${opts.subject}" htmlBytes=${opts.html.length}`);

  const started = Date.now();
  let fetchRes: globalThis.Response;
  try {
    fetchRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': env.BREVO_API_KEY,
        'accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (netErr) {
    const msg = netErr instanceof Error ? netErr.message : String(netErr);
    console.error(`[Email][Brevo] network error after ${Date.now() - started}ms:`, msg);
    throw new Error(`Brevo network error: ${msg}`);
  }

  const elapsed = Date.now() - started;
  const rawBody = await fetchRes.text();
  console.log(`[Email][Brevo] response status=${fetchRes.status} in ${elapsed}ms`);
  console.log(`[Email][Brevo] response body: ${rawBody.slice(0, 800)}`);

  if (!fetchRes.ok) {
    // 400 = bad request (often: sender not verified, invalid email)
    // 401 = bad API key
    // 402 = quota exceeded
    // 403 = sender not authorised
    if (fetchRes.status === 401) {
      console.error('[Email][Brevo] 401 — BREVO_API_KEY appears invalid or revoked');
    } else if (fetchRes.status === 400) {
      console.error('[Email][Brevo] 400 — usually sender email not verified, or invalid recipient');
    } else if (fetchRes.status === 402) {
      console.error('[Email][Brevo] 402 — Brevo account quota exceeded');
    } else if (fetchRes.status === 403) {
      console.error('[Email][Brevo] 403 — sender not authorised in your Brevo account');
    }
    throw new Error(`Brevo error ${fetchRes.status}: ${rawBody}`);
  }

  let parsed: { messageId?: string } = {};
  try { parsed = JSON.parse(rawBody); } catch {}
  return { messageId: parsed.messageId, raw: rawBody };
}

// ── POST /api/email ───────────────────────────────────────────────────────────
// Called by the client right after inserting a DB notification.
// Body: { userId, type, title, body, appUrl? }
// The server looks up the user's email via the service-role key and sends.

emailRouter.post('/', async (req: Request, res: Response) => {
  const reqId = Math.random().toString(36).slice(2, 8);
  console.log(`\n[Email][${reqId}] ──── incoming POST /api/email ────`);
  console.log(`[Email][${reqId}] origin=${req.headers.origin ?? 'n/a'} ua="${req.headers['user-agent']?.slice(0, 80) ?? 'n/a'}"`);
  console.log(`[Email][${reqId}] env: BREVO_API_KEY=${env.BREVO_API_KEY ? `set (len ${env.BREVO_API_KEY.length})` : 'MISSING'}, FROM=${env.EMAIL_FROM_ADDR} (${env.EMAIL_FROM_NAME})`);

  if (!env.BREVO_API_KEY) {
    console.warn(`[Email][${reqId}] SKIPPED — BREVO_API_KEY env var is not set on this server. Set it in Render → Environment to enable email.`);
    return res.json({ ok: true, skipped: true, reason: 'BREVO_API_KEY not set' });
  }

  const { userId, type, title, body, appUrl } = req.body as {
    userId?: string;
    type?: string;
    title?: string;
    body?: string;
    appUrl?: string;
  };

  console.log(`[Email][${reqId}] payload: userId=${userId} type=${type} title="${title}" bodyLen=${body?.length ?? 0} appUrl=${appUrl}`);

  if (!userId || !title || !body) {
    console.warn(`[Email][${reqId}] BAD REQUEST — missing one of userId/title/body`);
    return res.status(400).json({ error: 'userId, title, body required' });
  }

  try {
    // Look up the recipient: prefer the new public.app_users table; fall
    // back to auth.users so messages addressed to legacy (pre-migration)
    // accounts still deliver. Name comes from profiles.full_name.
    console.log(`[Email][${reqId}] looking up user…`);
    let email: string | undefined;

    const { data: appUser } = await supabaseAdmin
      .from('app_users')
      .select('email')
      .eq('id', userId)
      .maybeSingle();
    if (appUser?.email) {
      email = appUser.email;
    } else {
      const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userErr) {
        console.error(`[Email][${reqId}] user lookup failed:`, userErr.message);
        return res.json({ ok: true, skipped: true, reason: 'user lookup failed: ' + userErr.message });
      }
      if (!userData?.user?.email) {
        console.warn(`[Email][${reqId}] no email for userId=${userId}`);
        return res.json({ ok: true, skipped: true, reason: 'no email on file' });
      }
      email = userData.user.email;
    }

    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();
    const name = (prof?.full_name as string | undefined) ?? email;
    const url   = appUrl ?? 'https://aluhub.com';

    console.log(`[Email][${reqId}] resolved recipient: ${email} (${name})`);

    const html = buildEmail(type ?? 'notification', title, body, url);

    const result = await sendBrevoEmail({ toEmail: email!, toName: name ?? email!, subject: title, html });

    console.log(`[Email][${reqId}] ✓ sent to ${email} — Brevo messageId=${result.messageId ?? 'n/a'}`);
    res.json({ ok: true, messageId: result.messageId, to: email });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[Email][${reqId}] ✗ send failed:`, msg);
    // Return 200 so client doesn't retry — it's a best-effort notification
    res.json({ ok: false, error: msg });
  }
});

// ── GET /api/email/diag ───────────────────────────────────────────────────────
// Quick diagnostic endpoint: shows whether the server has the env vars wired,
// without revealing the actual key value.
emailRouter.get('/diag', (_req: Request, res: Response) => {
  res.json({
    brevoKeySet: Boolean(env.BREVO_API_KEY),
    brevoKeyLength: env.BREVO_API_KEY?.length ?? 0,
    fromName: env.EMAIL_FROM_NAME,
    fromAddr: env.EMAIL_FROM_ADDR,
    nodeEnv: env.NODE_ENV,
  });
});
