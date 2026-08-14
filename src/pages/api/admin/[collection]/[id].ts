import type { APIRoute } from 'astro'
import { ADMIN_COLLECTIONS, deleteItem, getItemById, updateItem, type StoreCollection } from '../../../../lib/server/store'
import { requireAdmin } from '../../../../lib/server/admin'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

function isCollection(value: string): value is StoreCollection {
  return (ADMIN_COLLECTIONS as string[]).includes(value)
}

export const GET: APIRoute = async ({ params, request }) => {
  if (!requireAdmin(request)) return json({ ok: false, error: 'Unauthorized.' }, 401)
  const { collection, id } = params
  if (!collection || !isCollection(collection) || !id) return json({ ok: false, error: 'Unknown collection.' }, 404)
  const item = getItemById(collection, id)
  if (!item) return json({ ok: false, error: 'Item not found.' }, 404)
  return json({ ok: true, item })
}

export const PUT: APIRoute = async ({ params, request }) => {
  if (!requireAdmin(request)) return json({ ok: false, error: 'Unauthorized.' }, 401)
  const { collection, id } = params
  if (!collection || !isCollection(collection) || !id) return json({ ok: false, error: 'Unknown collection.' }, 404)
  let data: Record<string, unknown>
  try {
    data = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400)
  }
  const item = updateItem(collection, id, data)
  if (!item) return json({ ok: false, error: 'Item not found.' }, 404)
  return json({ ok: true, item })
}

export const DELETE: APIRoute = async ({ params, request }) => {
  if (!requireAdmin(request)) return json({ ok: false, error: 'Unauthorized.' }, 401)
  const { collection, id } = params
  if (!collection || !isCollection(collection) || !id) return json({ ok: false, error: 'Unknown collection.' }, 404)
  const removed = deleteItem(collection, id)
  if (!removed) return json({ ok: false, error: 'Item not found.' }, 404)
  return json({ ok: true })
}
