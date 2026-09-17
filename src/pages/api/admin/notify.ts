import type { APIRoute } from 'astro'
import { requireAdmin } from '../../../lib/server/admin'
import { getItemById, logActivity, type AppointmentRecord, type CampRegistrationRecord, type StoreCollection } from '../../../lib/server/store'
import {
  resendAppointmentRequestToPatient,
  sendAppointmentConfirmationToPatient,
  sendCampConfirmation,
} from '../../../lib/server/notifications'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

const TYPES = ['confirm', 'resend'] as const
type NotifyType = (typeof TYPES)[number]

export const POST: APIRoute = async ({ request }) => {
  const user = await requireAdmin(request)
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401)

  let data: { collection?: string; id?: string; type?: string }
  try {
    data = (await request.json()) as { collection?: string; id?: string; type?: string }
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400)
  }

  const collection = String(data.collection || '') as StoreCollection
  const id = String(data.id || '')
  const type = String(data.type || 'confirm') as NotifyType
  if (!id) return json({ ok: false, error: 'Missing record id.' }, 422)
  if (!TYPES.includes(type)) return json({ ok: false, error: 'Unsupported notification type.' }, 422)

  const item = getItemById<Record<string, unknown>>(collection, id)
  if (!item) return json({ ok: false, error: 'Record not found.' }, 404)

  let sent = false
  if (collection === 'appointments') {
    const a = item as unknown as AppointmentRecord
    if (!a.email) return json({ ok: false, error: 'This appointment has no email address on record.' }, 422)
    sent = type === 'resend' ? await resendAppointmentRequestToPatient(a) : await sendAppointmentConfirmationToPatient(a)
  } else if (collection === 'campRegistrations') {
    const r = item as unknown as CampRegistrationRecord
    if (!r.email) return json({ ok: false, error: 'This registration has no email address on record.' }, 422)
    sent = await sendCampConfirmation(r)
  } else {
    return json({ ok: false, error: 'Notifications are not supported for this collection.' }, 422)
  }

  logActivity({
    user,
    action: sent ? 'email.sent' : 'email.failed',
    collection,
    itemId: id,
    summary: `${type === 'resend' ? 'Resent' : 'Confirmation'} email ${sent ? 'sent' : 'failed'} for ${id}`,
  })

  if (!sent) {
    return json({ ok: false, error: 'Could not send the email. Check the email settings and provider status.' }, 502)
  }
  return json({ ok: true, message: type === 'resend' ? 'Confirmation email resent.' : 'Confirmation email sent.' })
}
