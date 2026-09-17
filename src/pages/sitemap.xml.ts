import type { APIRoute } from 'astro'
import { getCollection } from '../lib/server/store'
import type { Doctor } from '../data/doctors'
import type { BlogPost } from '../data/blog'
import type { HealthCamp } from '../data/camps'
import type { Service } from '../data/services'
import { hospital } from '../data/site'

export const prerender = false

const staticPages = [
  '/',
  '/about',
  '/services',
  '/doctors',
  '/camps',
  '/blog',
  '/gallery',
  '/faq',
  '/contact',
  '/book',
  '/emergency',
  '/patient-rights',
  '/patient-guide',
  '/grievance',
  '/refund-cancellation',
  '/insurance',
  '/telemedicine',
  '/accessibility',
  '/hospital-information',
  '/privacy',
  '/terms',
  '/disclaimer',
]

export const GET: APIRoute = async () => {
  const base = `https://${hospital.domains.primary}`
  const urls: string[] = [...staticPages]

  getCollection<Service>('services').forEach((s) => urls.push(`/services/${s.slug}`))
  getCollection<Doctor>('doctors').forEach((d) => urls.push(`/doctors/${d.slug}`))
  getCollection<HealthCamp>('camps').forEach((c) => urls.push(`/camps/${c.slug}`))
  getCollection<BlogPost>('blogPosts').forEach((p) => urls.push(`/blog/${p.slug}`))

  const today = new Date().toISOString().slice(0, 10)
  const items = urls
    .map(
      (u) => `  <url>\n    <loc>${base}${u === '/' ? '/' : u + '/'}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${u === '/' ? '1.0' : '0.8'}</priority>\n  </url>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'no-store' },
  })
}
