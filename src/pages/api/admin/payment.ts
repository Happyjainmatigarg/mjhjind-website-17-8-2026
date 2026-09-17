import type { APIRoute } from 'astro'
import { requireAdmin } from '../../../lib/server/admin'
import { logActivity } from '../../../lib/server/store'
import { getPublicPaymentSettings, updatePaymentSettings, type PaymentSettingsPatch } from '../../../lib/server/settings'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

const PROVIDERS = ['offline', 'razorpay', 'payu', 'phonepe', 'cashfree', 'stripe']

export const GET: APIRoute = async ({ request }) => {
  if (!(await requireAdmin(request))) return json({ ok: false, error: 'Unauthorized.' }, 401)
  return json({ ok: true, settings: await getPublicPaymentSettings() })
}

export const PUT: APIRoute = async ({ request }) => {
  const user = await requireAdmin(request)
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401)
  let data: PaymentSettingsPatch
  try {
    data = (await request.json()) as PaymentSettingsPatch
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400)
  }
  if (data.provider && !PROVIDERS.includes(data.provider)) return json({ ok: false, error: 'Unsupported payment provider.' }, 422)
  if (data.mode && !['test', 'live'].includes(data.mode)) return json({ ok: false, error: 'Invalid mode.' }, 422)
  if (data.enabled && data.provider !== 'offline' && !data.keyId && !(await getPublicPaymentSettings()).keyId) {
    return json({ ok: false, error: 'Add the gateway Key ID before enabling online payments.' }, 422)
  }
  const settings = await updatePaymentSettings(data)
  logActivity({
    user,
    action: 'settings.update',
    collection: 'settings',
    itemId: 'payment',
    summary: `Payment settings updated (${settings.provider}, ${settings.mode}, ${settings.enabled ? 'enabled' : 'disabled'})`,
  })
  return json({ ok: true, settings })
}
