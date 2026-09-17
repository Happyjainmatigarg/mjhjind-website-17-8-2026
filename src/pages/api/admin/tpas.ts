import type { APIRoute } from 'astro'
import { requireAdmin } from '../../../lib/server/admin'
import { createTpa, getTpas, logActivity } from '../../../lib/server/store'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const GET: APIRoute = async ({ request }) => {
  if (!(await requireAdmin(request))) return json({ ok: false, error: 'Unauthorized.' }, 401)
  return json({ ok: true, items: getTpas() })
}

export const POST: APIRoute = async ({ request }) => {
  const user = await requireAdmin(request)
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401)
  let data: Record<string, unknown>
  try {
    data = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400)
  }
  if (!String(data.name || '').trim()) return json({ ok: false, error: 'Name is required.' }, 422)
  const item = createTpa(data)
  logActivity({ user, action: 'create', collection: 'tpas', itemId: item.id, summary: `Added ${item.type}: ${item.name}` })
  return json({ ok: true, item }, 201)
}
