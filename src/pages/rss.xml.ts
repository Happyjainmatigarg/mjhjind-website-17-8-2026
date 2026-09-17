import type { APIRoute } from 'astro'
import { getCollection } from '../lib/server/store'
import type { BlogPost } from '../data/blog'
import { hospital } from '../data/site'

export const prerender = false

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export const GET: APIRoute = async () => {
  const base = `https://${hospital.domains.primary}`
  const posts = getCollection<BlogPost>('blogPosts')
  const sorted = [...posts].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 30)

  const items = sorted
    .map((post) => {
      const link = `${base}/blog/${post.slug}/`
      const description = post.excerpt || post.content?.[0] || ''
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `      <category>${escapeXml(post.category)}</category>`,
        `      <description>${escapeXml(description)}</description>`,
        '    </item>',
      ].join('\n')
    })
    .join('\n')

  const lastBuild = sorted[0] ? new Date(sorted[0].date).toUTCString() : new Date().toUTCString()

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(hospital.name)} — Health Blog</title>`,
    `    <link>${base}/blog/</link>`,
    `    <description>${escapeXml(`Health and wellness articles from the doctors at ${hospital.name}.`)}</description>`,
    '    <language>en-IN</language>',
    `    <lastBuildDate>${lastBuild}</lastBuildDate>`,
    `    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
