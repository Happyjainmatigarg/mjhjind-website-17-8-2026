import type { APIRoute } from 'astro'
import { getActiveTpas, getSiteSettings } from '../../lib/server/store'

export const prerender = false

export const GET: APIRoute = async () => {
  const site = getSiteSettings()
  const social = (site.social || []).filter((s) => s.enabled && s.url)
  return new Response(
    JSON.stringify({
      ok: true,
      site: {
        email: site.email,
        phones: site.phones,
        address: site.address,
        hours: site.hours,
        social,
        updatedAt: site.updatedAt,
      },
      tpas: getActiveTpas().map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        logo: t.logo,
        helpline: t.helpline,
        email: t.email,
        cashless: t.cashless,
        notes: t.notes,
      })),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    }
  )
}
