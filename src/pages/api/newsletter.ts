import { createNewsletter } from '../../lib/server/store'
import { notifyAdminNewsletter, sendNewsletterWelcomeToSubscriber } from '../../lib/server/notifications'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, unknown>
  try {
    data = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400)
  }

  const email = typeof data.email === 'string' ? data.email.trim() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 422)
  }

  createNewsletter({ email })
  Promise.allSettled([sendNewsletterWelcomeToSubscriber(email), notifyAdminNewsletter(email)])
  return json({ ok: true, message: 'Subscribed! Thank you for joining our health updates.' }, 201)
}
