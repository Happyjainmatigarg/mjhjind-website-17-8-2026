import { createCampRegistration } from '../../lib/server/store'

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
  const age = Number(data.age)

  if (name.length < 3) return json({ ok: false, error: 'Please enter your full name.' }, 422)
  if (!age || age < 1 || age > 120) return json({ ok: false, error: 'Please enter a valid age.' }, 422)
  if (!isPhone(phone)) return json({ ok: false, error: 'Please enter a valid 10-digit Indian mobile number.' }, 422)
  if (email && !isEmail(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 422)
  if (!str(data.campSlug)) return json({ ok: false, error: 'Missing camp reference.' }, 422)

  const record = createCampRegistration(data)
  return json({ ok: true, id: record.id, message: 'Camp registration received. See you there!' }, 201)
}
