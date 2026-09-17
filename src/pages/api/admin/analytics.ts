import type { APIRoute } from 'astro'
import { requireAdmin } from '../../../lib/server/admin'
import { getCollection, type AppointmentRecord, type CampRegistrationRecord, type ContactRecord, type NewsletterRecord } from '../../../lib/server/store'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

const RANGES: Record<string, number> = { '7': 7, '30': 30, '90': 90, all: 0 }

function dayKey(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function countBy<T>(items: T[], key: (x: T) => string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const item of items) {
    const k = key(item) || '—'
    out[k] = (out[k] || 0) + 1
  }
  return out
}

function sortedEntries(obj: Record<string, number>): [string, number][] {
  return Object.entries(obj).sort((a, b) => b[1] - a[1])
}

export const GET: APIRoute = async ({ request }) => {
  if (!(await requireAdmin(request))) return json({ ok: false, error: 'Unauthorized.' }, 401)
  const url = new URL(request.url)
  const rangeKey = url.searchParams.get('range') || '30'
  const days = RANGES[rangeKey] ?? 30
  const since = days ? Date.now() - days * 86400000 : 0

  const appointments = getCollection<AppointmentRecord>('appointments')
  const camps = getCollection<CampRegistrationRecord>('campRegistrations')
  const contacts = getCollection<ContactRecord>('contacts')
  const newsletter = getCollection<NewsletterRecord>('newsletter')

  const within = <T extends { createdAt?: string }>(items: T[]) =>
    items.filter((i) => !since || new Date(i.createdAt || 0).getTime() >= since)

  const a = within(appointments)
  const c = within(camps)
  const m = within(contacts)
  const n = within(newsletter)

  const seriesDays = days || 30
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const series: { date: string; appointments: number; contacts: number; campRegistrations: number; newsletter: number }[] = []
  const index: Record<string, (typeof series)[number]> = {}
  for (let i = seriesDays - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const row = { date: key, appointments: 0, contacts: 0, campRegistrations: 0, newsletter: 0 }
    series.push(row)
    index[key] = row
  }
  a.forEach((x) => { const k = dayKey(x.createdAt); if (index[k]) index[k].appointments++ })
  m.forEach((x) => { const k = dayKey(x.createdAt); if (index[k]) index[k].contacts++ })
  c.forEach((x) => { const k = dayKey(x.createdAt); if (index[k]) index[k].campRegistrations++ })
  n.forEach((x) => { const k = dayKey(x.createdAt); if (index[k]) index[k].newsletter++ })

  const status = countBy(appointments, (x) => x.status)

  return json({
    ok: true,
    range: rangeKey,
    generatedAt: new Date().toISOString(),
    totals: {
      appointments: appointments.length,
      appointmentsInRange: a.length,
      campRegistrations: camps.length,
      contacts: contacts.length,
      newsletter: newsletter.length,
    },
    kpis: {
      pending: status.pending || 0,
      confirmed: status.confirmed || 0,
      completed: status.completed || 0,
      cancelled: status.cancelled || 0,
      unreadContacts: contacts.length,
      subscribers: newsletter.length,
    },
    byStatus: sortedEntries(status),
    byDoctor: sortedEntries(countBy(a, (x) => x.doctor || x.service || 'General OPD')).slice(0, 12),
    byService: sortedEntries(countBy(a, (x) => x.service || 'General')).slice(0, 12),
    series,
  })
}
