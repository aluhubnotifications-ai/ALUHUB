import { env } from '../config/env.js';

const accent = '#0A2E5C';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(10,46,92,.10);">
        <tr><td style="background:linear-gradient(135deg,${accent},#2563EB);padding:24px;text-align:center;color:#fff;">
          <div style="font-size:22px;font-weight:800;">ALUHub</div>
          <div style="font-size:13px;opacity:.7;margin-top:4px;">Student Platform for ALU</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:${accent};">${escapeHtml(title)}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #eef2f7;font-size:12px;color:#6b7280;text-align:center;">
          If you didn't request this, you can safely ignore the email.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendViaBrevo(toEmail: string, subject: string, html: string): Promise<void> {
  if (!env.BREVO_API_KEY) {
    console.warn('[auth-email] BREVO_API_KEY not set — skipping send to', toEmail);
    return;
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': env.BREVO_API_KEY,
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: env.EMAIL_FROM_NAME, email: env.EMAIL_FROM_ADDR },
      to: [{ email: toEmail }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo ${res.status}: ${body}`);
  }
}

export async function sendVerificationEmail(toEmail: string, token: string): Promise<void> {
  const link = `${env.APP_URL}/?verify_token=${encodeURIComponent(token)}`;
  const html = shell(
    'Verify your email',
    `<p style="font-size:15px;color:#374151;line-height:1.6;">
       Welcome to ALUHub! Tap the button below to confirm your email and finish creating your account.
     </p>
     <p style="margin:24px 0;">
       <a href="${link}" style="display:inline-block;padding:12px 28px;background:${accent};color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">Verify email →</a>
     </p>
     <p style="font-size:12px;color:#6b7280;">Or paste this link into your browser:<br/><code style="word-break:break-all;">${escapeHtml(link)}</code></p>
     <p style="font-size:12px;color:#6b7280;">This link expires in 24 hours.</p>`,
  );
  await sendViaBrevo(toEmail, 'Confirm your ALUHub email', html);
}

export async function sendPasswordResetEmail(toEmail: string, token: string): Promise<void> {
  const link = `${env.APP_URL}/?reset_token=${encodeURIComponent(token)}`;
  const html = shell(
    'Reset your password',
    `<p style="font-size:15px;color:#374151;line-height:1.6;">
       Someone (hopefully you) asked to reset your ALUHub password. Tap below to choose a new one.
     </p>
     <p style="margin:24px 0;">
       <a href="${link}" style="display:inline-block;padding:12px 28px;background:${accent};color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">Reset password →</a>
     </p>
     <p style="font-size:12px;color:#6b7280;">This link expires in 1 hour.</p>`,
  );
  await sendViaBrevo(toEmail, 'Reset your ALUHub password', html);
}
