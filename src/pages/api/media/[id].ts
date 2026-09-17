import type { APIRoute } from 'astro'
import { getMediaById } from '../../../lib/server/store'
import { base64ToBytes } from '../../../lib/server/base64'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  const { id } = params
  if (!id) return new Response('Not found', { status: 404 })
  const item = getMediaById(id)
  if (!item || !item.visible) return new Response('Not found', { status: 404 })
  const bytes = base64ToBytes(item.data)
  return new Response(bytes.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': item.mime || 'application/octet-stream',
      'Content-Length': String(bytes.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `inline; filename="${item.filename.replace(/"/g, '')}"`,
    },
  })
}
