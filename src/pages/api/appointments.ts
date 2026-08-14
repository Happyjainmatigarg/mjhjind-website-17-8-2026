import { createAppointment } from '../../lib/server/store'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

const isPhone = (p: string) => /^[6-9]\d{9}$/.test(p)
const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d)

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, unknown>
  try {
    data = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400)
  }

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const patientName = str(data.patientName)
  const phone = str(data.phone)
  const doctor = str(data.doctor)
  const service = str(data.service)

  if (patientName.length < 3) return json({ ok: false, error: 'Please enter the patient\'s full name.' }, 422)
  if (!isPhone(phone)) return json({ ok: false, error: 'Please enter a valid 10-digit Indian mobile number.' }, 422)
  if (!doctor && !service) return json({ ok: false, error: 'Please choose a doctor or department.' }, 422)
  if (!isDate(str(data.date))) return json({ ok: false, error: 'Please choose a valid date.' }, 422)
  if (!str(data.time)) return json({ ok: false, error: 'Please choose a time slot.' }, 422)

  const record = createAppointment(data)
  return json({ ok: true, id: record.id, message: 'Appointment request received. We will confirm by phone.' }, 201)
}
