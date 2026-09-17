import type { APIRoute } from 'astro'
import { requireAdmin } from '../../../../lib/server/admin'
import { deleteTpa, logActivity, updateTpa } from '../../../../lib/server/store'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const PUT: APIRoute = async ({ params, request }) => {
  const user = await requireAdmin(request)
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401)
  const { id } = params
  if (!id) return json({ ok: false, error: 'Missing id.' }, 404)
  let data: Record<string, unknown>
  try {
    data = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400)
  }
  const item = updateTpa(id, data)
  if (!item) return json({ ok: false, error: 'Not found.' }, 404)
  logActivity({ user, action: 'update', collection: 'tpas', itemId: id, summary: `Updated ${item.type}: ${item.name}` })
  return json({ ok: true, item })
}

export const DELETE: APIRoute = async ({ params, request }) => {
  const user = await requireAdmin(request)
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401)
  const { id } = params
  if (!id) return json({ ok: false, error: 'Missing id.' }, 404)
  if (!deleteTpa(id)) return json({ ok: false, error: 'Not found.' }, 404)
  logActivity({ user, action: 'delete', collection: 'tpas', itemId: id, summary: `Removed ${id}` })
  return json({ ok: true })
}
