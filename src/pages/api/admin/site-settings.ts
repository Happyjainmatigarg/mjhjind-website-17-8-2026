import type { APIRoute } from 'astro'
import { requireAdmin } from '../../../lib/server/admin'
import { getSiteSettings, logActivity } from '../../../lib/server/store'
import { updateSiteSettings, type SiteSettingsPatch } from '../../../lib/server/settings'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const GET: APIRoute = async ({ request }) => {
  if (!(await requireAdmin(request))) return json({ ok: false, error: 'Unauthorized.' }, 401)
  return json({ ok: true, settings: getSiteSettings() })
}

export const PUT: APIRoute = async ({ request }) => {
  const user = await requireAdmin(request)
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401)
  let data: SiteSettingsPatch
  try {
    data = (await request.json()) as SiteSettingsPatch
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400)
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) {
    return json({ ok: false, error: 'Enter a valid contact email address.' }, 422)
  }
  const settings = updateSiteSettings(data)
  logActivity({ user, action: 'settings.update', collection: 'settings', itemId: 'site', summary: 'Site & contact settings updated' })
  return json({ ok: true, settings })
}
