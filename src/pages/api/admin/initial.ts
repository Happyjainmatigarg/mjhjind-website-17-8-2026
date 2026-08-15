import type { APIRoute } from 'astro'
import { getDefaultStorage } from '../../../lib/server/storage'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const GET: APIRoute = async ({ request }) => {
  const storage = getDefaultStorage()
  const initial = await storage.getRaw('initial_password')
  if (!initial) return json({ ok: false, error: 'No initial password available.' }, 404)
  // return it once and delete
  await storage.deleteRaw('initial_password')
  return json({ ok: true, password: initial })
}
