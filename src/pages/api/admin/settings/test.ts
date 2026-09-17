import type { APIRoute } from 'astro'
import { requireAdmin } from '../../../../lib/server/admin'
import { getEmailConfig } from '../../../../lib/server/settings'
import { sendMail, wrapEmailHtml } from '../../../../lib/server/mailer'
import { hospital } from '../../../../data/site'
import { logActivity } from '../../../../lib/server/store'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export const POST: APIRoute = async ({ request }) => {
  const user = await requireAdmin(request)
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401)

  let data: { to?: string } = {}
  try {
    data = (await request.json()) as { to?: string }
  } catch {
    /* body optional */
  }

  const config = await getEmailConfig()
  if (config.transport === 'none') {
    return json({ ok: false, error: 'Email is not configured yet. Add SMTP details or an API key and save first.' }, 422)
  }

  const to = (data.to || '').trim() || config.fromEmail || config.adminNotifyEmails[0]
  if (!isEmail(to)) return json({ ok: false, error: 'Enter a valid recipient email address.' }, 422)

  const html = wrapEmailHtml(
    'Test Email',
    `<p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">This is a test email from the ${hospital.name} admin panel.</p>
     <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">If you received this, your email settings (${config.transport.toUpperCase()}) are working correctly.</p>`,
  )

  const sent = await sendMail({
    to,
    subject: `${hospital.name} — test email`,
    html,
    text: `This is a test email from the ${hospital.name} admin panel. Your ${config.transport} settings are working.`,
  })

  logActivity({
    user,
    action: 'settings.test',
    collection: 'settings',
    itemId: 'email',
    summary: `Test email via ${config.transport} to ${to} — ${sent ? 'sent' : 'failed'}`,
  })

  if (!sent) {
    return json({ ok: false, error: `Could not send via ${config.transport}. Check the credentials and provider logs.` }, 502)
  }
  return json({ ok: true, transport: config.transport, to })
}
