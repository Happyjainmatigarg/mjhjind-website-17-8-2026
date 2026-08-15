import type { APIRoute } from 'astro'
import { ADMIN_COLLECTIONS, createItem, getCollection, type StoreCollection } from '../../../lib/server/store'
import { requireAdmin } from '../../../lib/server/admin'

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
  if (!(await requireAdmin(request))) return json({ ok: false, error: 'Unauthorized.' }, 401)
  const { collection } = params
  if (!collection || !isCollection(collection)) return json({ ok: false, error: 'Unknown collection.' }, 404)
  return json({ ok: true, items: getCollection(collection) })
}

export const POST: APIRoute = async ({ params, request }) => {
  if (!(await requireAdmin(request))) return json({ ok: false, error: 'Unauthorized.' }, 401)
  const { collection } = params
  if (!collection || !isCollection(collection)) return json({ ok: false, error: 'Unknown collection.' }, 404)
  let data: Record<string, unknown>
  try {
    data = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400)
  }
  const item = createItem(collection, data)
  return json({ ok: true, item }, 201)
}
