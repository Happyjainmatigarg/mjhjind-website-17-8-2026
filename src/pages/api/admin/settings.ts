import type { APIRoute } from 'astro'
import { requireAdmin } from '../../../lib/server/admin'
import { getPublicEmailSettings, saveEmailSettings, type EmailSettingsPatch } from '../../../lib/server/settings'
import { logActivity } from '../../../lib/server/store'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const GET: APIRoute = async ({ request }) => {
  if (!(await requireAdmin(request))) return json({ ok: false, error: 'Unauthorized.' }, 401)
  return json({ ok: true, settings: await getPublicEmailSettings() })
}

export const PUT: APIRoute = async ({ request }) => {
  const user = await requireAdmin(request)
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401)
  let data: EmailSettingsPatch
  try {
    data = (await request.json()) as EmailSettingsPatch
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400)
  }
  const allowed = ['auto', 'smtp', 'api']
  if (data.mode && !allowed.includes(data.mode)) return json({ ok: false, error: 'Invalid mode.' }, 422)
  const settings = await saveEmailSettings(data)
  logActivity({
    user,
    action: 'settings.update',
    collection: 'settings',
    itemId: 'email',
    summary: `Email settings updated (mode: ${settings.mode}, transport: ${settings.transport})`,
  })
  return json({ ok: true, settings })
}
