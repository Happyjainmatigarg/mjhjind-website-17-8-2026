/*
  Mail delivery abstraction.

  Supports two transports, chosen by the admin email settings:
    - "api"  : provider HTTP API via fetch (Resend / SendGrid / Brevo). Works on
               Cloudflare Workers and Node.
    - "smtp" : classic SMTP via nodemailer, dynamically imported so the module
               can still be bundled for Workers (where it is never reached).

  Configured through the admin panel (/admin/settings), with environment
  variables as a fallback.
*/

import { hospital } from '../../data/site'
import { getEmailConfig, type ResolvedEmailConfig } from './settings'

export { hospital }

export interface MailMessage {
  to: string
  subject: string
  html: string
  text?: string
}

function readEnv(name: string): string {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[name]) return String(process.env[name])
  } catch {
    // Workers may not expose process.env
  }
  return ''
}

export function siteUrl(): string {
  return (readEnv('SITE_URL') || `https://${hospital.domains.primary}`).replace(/\/$/, '')
}

export function mailFrom(): string {
  return readEnv('MAIL_FROM') || readEnv('SMTP_USER') || `noreply@${hospital.domains.primary}`
}

export function adminNotifyEmails(): string[] {
  return readEnv('ADMIN_NOTIFY_EMAILS')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}

export async function isMailConfigured(): Promise<boolean> {
  const config = await getEmailConfig()
  return config.transport !== 'none'
}

async function sendViaApi(config: ResolvedEmailConfig, message: MailMessage): Promise<boolean> {
  const from = `"${config.fromName}" <${config.fromEmail || mailFrom()}>`
  const to = message.to.split(',').map((t) => t.trim()).filter(Boolean)
  try {
    if (config.provider === 'sendgrid') {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: to.map((email) => ({ email })) }],
          from: { email: config.fromEmail || mailFrom(), name: config.fromName },
          subject: message.subject,
          content: [
            { type: 'text/plain', value: message.text || '' },
            { type: 'text/html', value: message.html },
          ],
        }),
      })
      if (!res.ok) console.error('[mailer] SendGrid error:', res.status, await safeText(res))
      return res.ok
    }
    if (config.provider === 'brevo') {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': config.apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          sender: { name: config.fromName, email: config.fromEmail || mailFrom() },
          to: to.map((email) => ({ email })),
          subject: message.subject,
          htmlContent: message.html,
          textContent: message.text || '',
        }),
      })
      if (!res.ok) console.error('[mailer] Brevo error:', res.status, await safeText(res))
      return res.ok
    }
    // Default: Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    })
    if (!res.ok) console.error('[mailer] Resend error:', res.status, await safeText(res))
    return res.ok
  } catch (err) {
    console.error('[mailer] API send failed:', err instanceof Error ? err.message : err)
    return false
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300)
  } catch {
    return ''
  }
}

async function sendViaSmtp(config: ResolvedEmailConfig, message: MailMessage): Promise<boolean> {
  try {
    const mod: any = await import('nodemailer')
    const nodemailer = mod?.default ?? mod
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    })
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail || mailFrom()}>`,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    })
    return true
  } catch (err) {
    console.error('[mailer] SMTP send failed:', err instanceof Error ? err.message : err)
    return false
  }
}

export async function sendMail(message: MailMessage): Promise<boolean> {
  const config = await getEmailConfig()
  if (config.transport === 'none') return false
  if (config.transport === 'api') return sendViaApi(config, message)
  return sendViaSmtp(config, message)
}

export function wrapEmailHtml(title: string, bodyHtml: string): string {
  const site = siteUrl()
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f5f2;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f5f2;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:#2d5f8a;padding:24px 28px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.3px;">${escapeHtml(hospital.name)}</p>
              <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">${escapeHtml(hospital.tagline)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">${escapeHtml(title)}</h2>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:18px 28px;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 6px;color:#6b7280;font-size:12px;line-height:1.6;">
                ${escapeHtml(hospital.name)} · ${escapeHtml(hospital.address.line1)}, ${escapeHtml(hospital.address.city)}, ${escapeHtml(hospital.address.state)} ${escapeHtml(hospital.address.pincode)}
              </p>
              <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">
                Emergency: <a href="tel:${escapeHtml(hospital.phones.emergency)}" style="color:#2d5f8a;text-decoration:none;">${escapeHtml(hospital.phones.emergency)}</a> · Appointments: <a href="tel:${escapeHtml(hospital.phones.appointment)}" style="color:#2d5f8a;text-decoration:none;">${escapeHtml(hospital.phones.appointment)}</a>
              </p>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} ${escapeHtml(hospital.name)} · <a href="${site}" style="color:#2d5f8a;text-decoration:none;">${site}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function emailRow(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:600;vertical-align:top;">${value ? escapeHtml(value) : '—'}</td>
  </tr>`
}
