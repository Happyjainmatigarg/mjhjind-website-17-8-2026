import type { APIRoute } from 'astro'
import { ADMIN_COLLECTIONS, createItem, getCollection, logActivity, type StoreCollection } from '../../../lib/server/store'
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
  const user = await requireAdmin(request)
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401)
  const { collection } = params
  if (!collection || !isCollection(collection)) return json({ ok: false, error: 'Unknown collection.' }, 404)
  let data: Record<string, unknown>
  try {
    data = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400)
  }
  const item = createItem(collection, data)
  if (item) {
    const label = String(item.name ?? item.title ?? item.question ?? item.email ?? item.id ?? '')
    logActivity({ user, action: 'create', collection, itemId: String(item.id ?? item.slug ?? ''), summary: `Created ${collection}: ${label}` })
  }
  return json({ ok: true, item }, 201)
}
