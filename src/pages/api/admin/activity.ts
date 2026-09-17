import type { APIRoute } from 'astro'
import { requireAdmin } from '../../../lib/server/admin'
import { clearActivity, getActivity } from '../../../lib/server/store'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const GET: APIRoute = async ({ request }) => {
  if (!(await requireAdmin(request))) return json({ ok: false, error: 'Unauthorized.' }, 401)
  const url = new URL(request.url)
  const action = (url.searchParams.get('action') || '').trim().toLowerCase()
  const collection = (url.searchParams.get('collection') || '').trim()
  const q = (url.searchParams.get('q') || '').trim().toLowerCase()
  const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)

  let items = getActivity()
  if (action) items = items.filter((a) => a.action.toLowerCase() === action)
  if (collection) items = items.filter((a) => a.collection === collection)
  if (q) items = items.filter((a) => `${a.summary} ${a.user} ${a.itemId}`.toLowerCase().includes(q))

  const total = items.length
  items = items.slice(offset, offset + limit)
  return json({ ok: true, total, items })
}

export const DELETE: APIRoute = async ({ request }) => {
  const user = await requireAdmin(request)
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401)
  clearActivity()
  return json({ ok: true })
}
