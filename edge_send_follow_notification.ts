// ALUHub Edge Function: send-follow-notification
// Triggered by Supabase Database Webhook on job_listings INSERT
// Sends personalised emails via Brevo to all followers of the company

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BREVO_KEY = Deno.env.get('BREVO_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ALU_HUB_URL = Deno.env.get('ALU_HUB_URL') || 'https://aluhub.pages.dev'

async function sendEmail({ toEmail, toName, subject, html }: {
  toEmail: string, toName: string, subject: string, html: string
}) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'ALU Hub', email: 'aluhub.notifications@gmail.com' },
      to: [{ email: toEmail, name: toName }],
      subject,
      htmlContent: html,
    }),
  })
  return res.ok
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record
    if (!record || payload.type !== 'INSERT') return new Response('Not an INSERT', { status: 200 })

    const { id: listingId, company_id, title, listing_type, deadline, location, pay } = record
    if (!company_id || !title) return new Response('Missing fields', { status: 200 })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get company name
    const { data: company } = await supabase
      .from('profiles')
      .select('company_name')
      .eq('id', company_id)
      .single()
    const companyName = company?.company_name || 'A company on ALU Hub'

    // Get followers who want emails
    const { data: follows } = await supabase
      .from('company_follows')
      .select('student_id, email_notifications')
      .eq('company_id', company_id)

    if (!follows?.length) return new Response('No followers', { status: 200 })

    const wantEmail = follows.filter(f => f.email_notifications !== false)
    if (!wantEmail.length) return new Response('All opted out', { status: 200 })

    // Get student emails from Supabase auth
    let sent = 0, failed = 0
    const deadlineStr = deadline
      ? new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Rolling'

    for (const f of wantEmail) {
      const { data: authUser } = await supabase.auth.admin.getUserById(f.student_id)
      const email = authUser?.user?.email
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', f.student_id).single()
      if (!email) { failed++; continue }

      const ok = await sendEmail({
        toEmail: email,
        toName: profile?.full_name || 'Student',
        subject: `🔔 ${companyName} just posted: ${title}`,
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:#0A2E5C;border-radius:16px 16px 0 0;padding:28px 36px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-.5px;">ALU Hub</div>
      <div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:2px;">Student Platform for ALU & CMU-Africa</div></td>
      <td align="right"><span style="background:#FFCB00;color:#0A2E5C;font-size:11px;font-weight:800;padding:5px 12px;border-radius:20px;">FOLLOWING</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#fff;padding:32px 36px;">
    <p style="margin:0 0 6px;font-size:14px;color:#666;">Hi ${profile?.full_name || 'there'},</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:900;color:#0A2E5C;line-height:1.3;">${companyName} just posted a new ${listing_type || 'listing'}</h1>
    <div style="background:#F4F6F9;border-radius:12px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FFCB00;">
      <div style="font-size:18px;font-weight:800;color:#0A2E5C;margin-bottom:8px;">${title}</div>
      ${location ? `<div style="font-size:13px;color:#555;margin-bottom:4px;">📍 ${location}</div>` : ''}
      ${pay ? `<div style="font-size:13px;color:#555;margin-bottom:4px;">💰 ${pay}</div>` : ''}
      <div style="font-size:13px;color:#555;">📅 Deadline: ${deadlineStr}</div>
    </div>
    <p style="font-size:14px;color:#555;line-height:1.65;margin:0 0 24px;">You follow <strong>${companyName}</strong> on ALU Hub. Don't miss this — apply before the deadline.</p>
    <a href="${ALU_HUB_URL}?company=${company_id}&listing=${listingId}" style="display:inline-block;background:#FFCB00;color:#0A2E5C;font-size:14px;font-weight:800;padding:14px 28px;border-radius:10px;text-decoration:none;">View & Apply →</a>
  </td></tr>
  <tr><td style="background:#F4F6F9;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center;">
    <p style="font-size:12px;color:#999;margin:0 0 6px;">You're receiving this because you follow ${companyName} on ALU Hub.</p>
    <a href="${ALU_HUB_URL}/unsubscribe?student=${f.student_id}&company=${company_id}" style="font-size:12px;color:#999;">Unsubscribe</a>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
      })
      ok ? sent++ : failed++
    }

    console.log(`Sent ${sent}, failed ${failed} for listing ${listingId}`)
    return new Response(JSON.stringify({ sent, failed }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
