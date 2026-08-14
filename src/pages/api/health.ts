import fs from 'node:fs'
import path from 'node:path'

export const prerender = false

export const GET: APIRoute = async () => {
  const storeFile = path.resolve(process.cwd(), 'data', 'store.json')
  let counts = { appointments: 0, campRegistrations: 0, contacts: 0, newsletter: 0 }
  try {
    const raw = fs.readFileSync(storeFile, 'utf-8')
    const data = JSON.parse(raw)
    counts = {
      appointments: data.appointments?.length ?? 0,
      campRegistrations: data.campRegistrations?.length ?? 0,
      contacts: data.contacts?.length ?? 0,
      newsletter: data.newsletter?.length ?? 0,
    }
  } catch {
    /* store not created yet — report zeros */
  }
  return new Response(
    JSON.stringify({ ok: true, service: 'mj-hospital-api', counts }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
  )
}
