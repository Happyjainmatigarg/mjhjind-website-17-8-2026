import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { hospital } from '../../data/site'

export { hospital }

export interface MailMessage {
  to: string
  subject: string
  html: string
  text?: string
}

let cachedTransporter: Transporter | null = null
let lastConfigHash = ''

function configHash(): string {
  return [
    process.env.SMTP_HOST || '',
    process.env.SMTP_PORT || '',
    process.env.SMTP_USER || '',
    process.env.SMTP_PASS || '',
  ].join('|')
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)
}

function getTransporter(): Transporter | null {
  if (!isMailConfigured()) return null
  const hash = configHash()
  if (cachedTransporter && lastConfigHash === hash) return cachedTransporter
  lastConfigHash = hash
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  return cachedTransporter
}

export function mailFrom(): string {
  return process.env.MAIL_FROM || process.env.SMTP_USER || `noreply@${hospital.domains.primary}`
}

export function siteUrl(): string {
  return (process.env.SITE_URL || `https://${hospital.domains.primary}`).replace(/\/$/, '')
}

export function adminNotifyEmails(): string[] {
  return (process.env.ADMIN_NOTIFY_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}

export async function sendMail(message: MailMessage): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) return false
  try {
    await transporter.sendMail({
      from: `"${hospital.name}" <${mailFrom()}>`,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    })
    return true
  } catch (err) {
    console.error('[mailer] Failed to send email:', err instanceof Error ? err.message : err)
    return false
  }
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
