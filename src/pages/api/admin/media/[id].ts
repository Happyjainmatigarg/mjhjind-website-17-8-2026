import type { APIRoute } from 'astro'
import { requireAdmin } from '../../../../lib/server/admin'
import { deleteMedia, logActivity, updateMedia } from '../../../../lib/server/store'

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
  let data: { alt?: string; folder?: string; visible?: boolean; filename?: string }
  try {
    data = (await request.json()) as typeof data
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400)
  }
  const item = updateMedia(id, data)
  if (!item) return json({ ok: false, error: 'Not found.' }, 404)
  logActivity({ user, action: 'update', collection: 'media', itemId: id, summary: `Updated media ${item.filename} (${item.visible ? 'visible' : 'hidden'})` })
  return json({ ok: true, item: { ...item, data: undefined, url: `/api/media/${item.id}` } })
}

export const DELETE: APIRoute = async ({ params, request }) => {
  const user = await requireAdmin(request)
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401)
  const { id } = params
  if (!id) return json({ ok: false, error: 'Missing id.' }, 404)
  if (!deleteMedia(id)) return json({ ok: false, error: 'Not found.' }, 404)
  logActivity({ user, action: 'delete', collection: 'media', itemId: id, summary: `Deleted media ${id}` })
  return json({ ok: true })
}
