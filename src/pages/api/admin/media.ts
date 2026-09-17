import type { APIRoute } from 'astro'
import { requireAdmin } from '../../../lib/server/admin'
import { createMedia, getMedia, logActivity } from '../../../lib/server/store'
import { bytesToBase64 } from '../../../lib/server/base64'

export const prerender = false

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const GET: APIRoute = async ({ request }) => {
  if (!(await requireAdmin(request))) return json({ ok: false, error: 'Unauthorized.' }, 401)
  return json({ ok: true, items: getMedia() })
}

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif']
const MAX_BYTES = 4 * 1024 * 1024

export const POST: APIRoute = async ({ request }) => {
  const user = await requireAdmin(request)
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401)

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json({ ok: false, error: 'Expected a multipart form upload.' }, 400)
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) return json({ ok: false, error: 'Choose an image file to upload.' }, 422)
  if (!ALLOWED.includes(file.type)) {
    return json({ ok: false, error: 'Unsupported file type. Upload PNG, JPEG, WebP, GIF, AVIF or SVG.' }, 422)
  }
  if (file.size > MAX_BYTES) return json({ ok: false, error: 'File is larger than the 4 MB limit.' }, 422)

  const buffer = new Uint8Array(await file.arrayBuffer())
  const base64 = bytesToBase64(buffer)
  const item = createMedia({
    filename: file.name || 'upload',
    mime: file.type,
    size: file.size,
    data: base64,
    alt: String(form.get('alt') || ''),
    folder: String(form.get('folder') || 'general'),
    visible: String(form.get('visible') || 'true') !== 'false',
  })
  logActivity({ user, action: 'upload', collection: 'media', itemId: item.id, summary: `Uploaded ${item.filename} (${(item.size / 1024).toFixed(0)} KB)` })
  return json({ ok: true, item: { ...item, data: undefined, url: `/api/media/${item.id}` } }, 201)
}
