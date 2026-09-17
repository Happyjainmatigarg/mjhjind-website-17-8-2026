/*
  Hydrates public site contact details, opening hours and social links from the
  admin-managed CMS settings (/api/site). Falls back silently to the values
  rendered at build time when the API is unavailable.
*/

interface SiteSocial {
  key: string
  label: string
  url: string
  icon: string
}

interface SitePayload {
  site: {
    email: string
    phones: Record<string, string>
    address: Record<string, string>
    hours: Record<string, string>
    social: SiteSocial[]
  }
}

const SOCIAL_ICONS: Record<string, string> = {
  facebook: '<path d="M13.5 21v-7h2.5l.5-3h-3V9c0-.9.3-1.5 1.6-1.5h1.4V4.8c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.4-3.8 3.9v2.4H8v3h2.5v7h3z" fill="currentColor" stroke="none"/>',
  instagram:
    '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
  whatsapp:
    '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 004.74 1.21h.01c5.46 0 9.91-4.45 9.91-11.91 0-3.18-1.24-6.17-3.49-8.42A11.82 11.82 0 0012.04 2zm5.78 14.19c-.24.68-1.4 1.3-1.95 1.35-.5.05-1.12.07-1.8-.11-1.12-.35-2.29-.98-3.75-2.32-1.47-1.35-2.59-2.94-3.01-3.79-.06-.13-.82-1.13-.82-2.15 0-1.02.53-1.52.72-1.73.19-.21.41-.26.55-.26h.4c.13 0 .3-.05.47.36.17.41.58 1.42.63 1.52.05.1.09.21.02.35-.07.13-.1.21-.21.33-.1.12-.21.28-.31.37-.1.1-.21.21-.09.41.12.21.53.87 1.14 1.42.78.7 1.44.92 1.64 1.02.21.1.33.09.45-.05.12-.13.52-.6.65-.81.13-.21.27-.17.45-.1.19.07 1.19.56 1.39.66.21.1.35.16.4.24.05.09.05.49-.12 1.04-.16.55-.91 1.04-1.26 1.06-.17.01-.37.03-.6-.04z" fill="currentColor" stroke="none"/>',
  linkedin:
    '<path d="M4.98 3.5A2.5 2.5 0 002.5 6a2.5 2.5 0 002.48 2.5A2.5 2.5 0 007.5 6a2.5 2.5 0 00-2.52-2.5zM3 9.75h4V20H3V9.75zM10 9.75h3.83v1.4h.05c.53-.95 1.84-1.95 3.79-1.95 4.05 0 4.8 2.5 4.8 5.75V20h-4v-4.6c0-1.1-.02-2.5-1.6-2.5-1.6 0-1.84 1.18-1.84 2.42V20H10V9.75z" fill="currentColor" stroke="none"/>',
  x: '<path d="M4 4l16 16M20 4L4 20" stroke-width="1.8"/>',
}

function svgIcon(key: string): string {
  const inner = SOCIAL_ICONS[key] || SOCIAL_ICONS.x
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

function applySocial(social: SiteSocial[]): void {
  document.querySelectorAll<HTMLElement>('[data-site-social]').forEach((container) => {
    if (!social.length) {
      container.innerHTML = ''
      return
    }
    container.innerHTML = social
      .map(
        (s) =>
          `<a href="${s.url}" data-social="${s.key}" target="_blank" rel="noopener noreferrer" aria-label="${s.label}" class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-heal-600">${svgIcon(s.key === 'x' ? 'x' : s.icon || s.key)}</a>`
      )
      .join('')
  })
}

function applyText(selector: string, value: string | undefined, href?: (value: string) => string): void {
  if (!value) return
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    if (href) {
      const link = el instanceof HTMLAnchorElement ? el : el.closest('a')
      if (link) link.setAttribute('href', href(value))
    }
    el.textContent = value
  })
}

export default function initSiteSettings(): void {
  if (typeof fetch !== 'function') return
  fetch('/api/site', { headers: { Accept: 'application/json' } })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: SitePayload | null) => {
      if (!data?.site) return
      const { site } = data
      applyText('[data-site-email]', site.email, (v) => `mailto:${v}`)
      applyText('[data-site-phone="reception"]', site.phones?.reception, telHref)
      applyText('[data-site-phone="emergency"]', site.phones?.emergency, telHref)
      applyText('[data-site-phone="ambulance"]', site.phones?.ambulance, telHref)
      applyText('[data-site-phone="appointment"]', site.phones?.appointment, telHref)
      applyText('[data-site-hours="opd"]', site.hours?.opd)
      const addressEls = document.querySelectorAll<HTMLElement>('[data-site-address]')
      const a = site.address
      if (a) {
        addressEls.forEach((el) => {
          el.innerHTML = `${a.line1 || ''}${a.line2 ? `<br />${a.line2}` : ''}<br />${[a.city, a.state].filter(Boolean).join(', ')}${a.pincode ? ` — ${a.pincode}` : ''}`
        })
      }
      if (Array.isArray(site.social)) applySocial(site.social)
    })
    .catch(() => {
      /* keep build-time defaults */
    })
}
