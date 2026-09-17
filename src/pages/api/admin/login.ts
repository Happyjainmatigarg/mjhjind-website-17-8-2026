import type { APIRoute } from 'astro'
import { verifyLogin } from '../../../lib/server/admin'
import { logActivity } from '../../../lib/server/store'

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
    if (!result) {
      logActivity({
        user: String(data.username || 'unknown'),
        action: 'login.failed',
        collection: 'auth',
        itemId: '',
        summary: 'Failed sign-in attempt',
      })
      return json({ ok: false, error: 'Invalid username or password.' }, 401)
    }
    logActivity({ user: result.username, action: 'login', collection: 'auth', itemId: '', summary: 'Signed in to admin panel' })
    return json({ ok: true, ...result })
  } catch {
    return json({ ok: false, error: 'Login failed. Please try again.' }, 500)
  }
}
