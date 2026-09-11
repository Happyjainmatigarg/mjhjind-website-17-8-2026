import type { APIRoute } from 'astro'
import { verifyLogin } from '../../../lib/server/admin'

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
  try {
    const result = await verifyLogin(String(data.username || ''), String(data.password || ''))
    if (!result) return json({ ok: false, error: 'Invalid username or password.' }, 401)
    return json({ ok: true, ...result })
  } catch {
    return json({ ok: false, error: 'Login failed. Please try again.' }, 500)
  }
}
