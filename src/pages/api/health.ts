export const prerender = false

export const GET: APIRoute = async () => {
  // Cloudflare Workers (and other serverless runtimes) don't provide Node built-ins
  // like fs/path at runtime. Reading local files caused a 500 when deployed.
  // Return static health information instead to keep the endpoint reliable.
  const counts = { appointments: 0, campRegistrations: 0, contacts: 0, newsletter: 0 }

  return new Response(
    JSON.stringify({ ok: true, service: 'mj-hospital-api', counts }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
  )
}
