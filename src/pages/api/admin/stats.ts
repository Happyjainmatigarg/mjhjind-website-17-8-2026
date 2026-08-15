import type { APIRoute } from 'astro'
import { ADMIN_COLLECTIONS, getCollection, type StoreCollection } from '../../../lib/server/store'
import { requireAdmin } from '../../../lib/server/admin'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const GET: APIRoute = async ({ request }) => {
  if (!(await requireAdmin(request))) return json({ ok: false, error: 'Unauthorized.' }, 401)
  const counts: Record<string, number> = {}
  for (const key of ADMIN_COLLECTIONS) {
    counts[key] = getCollection(key as StoreCollection).length
  }
  return json({ ok: true, counts })
}
