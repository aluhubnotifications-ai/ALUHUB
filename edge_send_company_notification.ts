// ALUHub Edge Function: send-company-notification
// Notifies companies of new applications and new reviews via Brevo

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
    const { type, table, record } = payload
    if (type !== 'INSERT') return new Response('Not an INSERT', { status: 200 })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // ── NEW APPLICATION → notify company ──────────────────────────
    if (table === 'applications') {
      const { student_id, job_id, cover_note } = record

      const { data: job } = await supabase.from('job_listings').select('title, company_id').eq('id', job_id).single()
      if (!job) return new Response('Job not found', { status: 200 })

      const { data: companyAuth } = await supabase.auth.admin.getUserById(job.company_id)
      const companyEmail = companyAuth?.user?.email
      if (!companyEmail) return new Response('No company email', { status: 200 })

      const [{ data: companyProfile }, { data: studentProfile }] = await Promise.all([
        supabase.from('profiles').select('company_name').eq('id', job.company_id).single(),
        supabase.from('profiles').select('full_name, school, year').eq('id', student_id).single(),
      ])

      await sendEmail({
        toEmail: companyEmail,
        toName: companyProfile?.company_name || 'Company',
        subject: `📋 New application for ${job.title}`,
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:#0A2E5C;border-radius:16px 16px 0 0;padding:28px 36px;">
    <div style="font-size:22px;font-weight:900;color:#fff;">ALU Hub</div>
    <div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:2px;">Company Dashboard Notification</div>
  </td></tr>
  <tr><td style="background:#fff;padding:32px 36px;">
    <p style="margin:0 0 6px;font-size:14px;color:#666;">Hi ${companyProfile?.company_name || 'there'},</p>
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:900;color:#0A2E5C;">New Application Received</h1>
    <div style="background:#F4F6F9;border-radius:12px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FFCB00;">
      <div style="font-size:16px;font-weight:800;color:#0A2E5C;margin-bottom:6px;">${studentProfile?.full_name || 'A student'}</div>
      <div style="font-size:13px;color:#555;margin-bottom:3px;">🎓 ${studentProfile?.school || 'ALU'}${studentProfile?.year ? ' · ' + studentProfile.year : ''}</div>
      <div style="font-size:13px;color:#555;">💼 Applied for: <strong>${job.title}</strong></div>
      ${cover_note ? `<div style="font-size:13px;color:#555;margin-top:10px;padding-top:10px;border-top:1px solid #e0e0e0;font-style:italic;">"${cover_note.slice(0, 200)}${cover_note.length > 200 ? '…' : ''}"</div>` : ''}
    </div>
    <a href="${ALU_HUB_URL}?page=company_applications" style="display:inline-block;background:#FFCB00;color:#0A2E5C;font-size:14px;font-weight:800;padding:14px 28px;border-radius:10px;text-decoration:none;">Review Application →</a>
  </td></tr>
  <tr><td style="background:#F4F6F9;border-radius:0 0 16px 16px;padding:16px 36px;text-align:center;">
    <p style="font-size:12px;color:#999;margin:0;">ALU Hub · Student Platform for ALU & CMU-Africa</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
      })
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }

    // ── NEW REVIEW → notify company ────────────────────────────────
    if (table === 'company_ratings') {
      const { company_id, student_id, score, comment } = record

      const { data: companyAuth } = await supabase.auth.admin.getUserById(company_id)
      const companyEmail = companyAuth?.user?.email
      if (!companyEmail) return new Response('No company email', { status: 200 })

      const [{ data: companyProfile }, { data: studentProfile }] = await Promise.all([
        supabase.from('profiles').select('company_name').eq('id', company_id).single(),
        supabase.from('profiles').select('full_name').eq('id', student_id).single(),
      ])

      const stars = '★'.repeat(score) + '☆'.repeat(5 - score)

      await sendEmail({
        toEmail: companyEmail,
        toName: companyProfile?.company_name || 'Company',
        subject: `⭐ New review for ${companyProfile?.company_name || 'your company'}`,
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:#0A2E5C;border-radius:16px 16px 0 0;padding:28px 36px;">
    <div style="font-size:22px;font-weight:900;color:#fff;">ALU Hub</div>
    <div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:2px;">Company Dashboard Notification</div>
  </td></tr>
  <tr><td style="background:#fff;padding:32px 36px;">
    <p style="margin:0 0 6px;font-size:14px;color:#666;">Hi ${companyProfile?.company_name || 'there'},</p>
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:900;color:#0A2E5C;">You received a new review</h1>
    <div style="background:#F4F6F9;border-radius:12px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #F59E0B;">
      <div style="font-size:16px;font-weight:800;color:#0A2E5C;margin-bottom:4px;">${studentProfile?.full_name || 'A student'}</div>
      <div style="font-size:24px;color:#F59E0B;margin-bottom:8px;">${stars}</div>
      ${comment ? `<div style="font-size:14px;color:#555;font-style:italic;">"${comment}"</div>` : '<div style="font-size:13px;color:#999;">No comment left.</div>'}
    </div>
    <a href="${ALU_HUB_URL}?page=profile" style="display:inline-block;background:#FFCB00;color:#0A2E5C;font-size:14px;font-weight:800;padding:14px 28px;border-radius:10px;text-decoration:none;">View Your Profile →</a>
  </td></tr>
  <tr><td style="background:#F4F6F9;border-radius:0 0 16px 16px;padding:16px 36px;text-align:center;">
    <p style="font-size:12px;color:#999;margin:0;">ALU Hub · Student Platform for ALU & CMU-Africa</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
      })
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }

    return new Response('Table not handled', { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
