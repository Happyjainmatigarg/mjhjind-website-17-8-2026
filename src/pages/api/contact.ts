import { createContact } from '../../lib/server/store'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

const isPhone = (p: string) => /^[6-9]\d{9}$/.test(p)
const isEmail = (e: string) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, unknown>
  try {
    data = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400)
  }

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const name = str(data.name)
  const phone = str(data.phone)
  const email = str(data.email)
  const message = str(data.message)

  if (name.length < 3) return json({ ok: false, error: 'Please enter your full name.' }, 422)
  if (!isPhone(phone)) return json({ ok: false, error: 'Please enter a valid 10-digit Indian mobile number.' }, 422)
  if (email && !isEmail(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 422)
  if (message.length < 10) return json({ ok: false, error: 'Please write a message of at least 10 characters.' }, 422)

  const record = createContact(data)
  return json({ ok: true, id: record.id, message: 'Message received. We will get back to you soon.' }, 201)
}
