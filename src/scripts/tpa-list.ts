/*
  Renders the public list of empanelled insurers/TPAs from /api/site.
  Falls back to a friendly message if the API is unavailable.
*/

interface TpaItem {
  id: string
  name: string
  type: 'insurer' | 'tpa'
  logo: string
  helpline: string
  email: string
  cashless: boolean
  notes: string
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function card(t: TpaItem): string {
  const kind = t.type === 'tpa' ? 'TPA' : 'Insurer'
  return `<div class="rounded-md border border-gray-200 bg-white p-5 dark:border-night-border dark:bg-night-surface">
    <div class="flex items-start gap-4">
      ${
        t.logo
          ? `<img src="${esc(t.logo)}" alt="${esc(t.name)} logo" class="h-12 w-16 shrink-0 object-contain" loading="lazy" />`
          : `<span class="flex h-12 w-16 shrink-0 items-center justify-center rounded bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300">${esc(t.name.slice(0, 2).toUpperCase())}</span>`
      }
      <div class="min-w-0">
        <h3 class="font-semibold" style="color: var(--color-heading)">${esc(t.name)}</h3>
        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">${esc(kind)}${t.cashless ? ' · Cashless' : ''}</p>
      </div>
    </div>
    ${
      t.helpline || t.email
        ? `<dl class="mt-3 space-y-1 text-sm text-gray-600 dark:text-slate-400">
            ${t.helpline ? `<div><dt class="inline font-medium text-gray-700 dark:text-slate-300">Helpline: </dt><dd class="inline"><a href="tel:${esc(t.helpline.replace(/[^+\d]/g, ''))}" class="hover:underline">${esc(t.helpline)}</a></dd></div>` : ''}
            ${t.email ? `<div><dt class="inline font-medium text-gray-700 dark:text-slate-300">Email: </dt><dd class="inline"><a href="mailto:${esc(t.email)}" class="hover:underline">${esc(t.email)}</a></dd></div>` : ''}
          </dl>`
        : ''
    }
    ${t.notes ? `<p class="mt-2 text-sm text-gray-600 dark:text-slate-400">${esc(t.notes)}</p>` : ''}
  </div>`
}

export function initTpaList(): void {
  const container = document.querySelector<HTMLElement>('[data-tpa-list]')
  if (!container || typeof fetch !== 'function') return
  fetch('/api/site', { headers: { Accept: 'application/json' } })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { tpas?: TpaItem[] } | null) => {
      const items = data?.tpas || []
      if (!items.length) {
        container.innerHTML = `<p class="text-sm text-gray-600 dark:text-slate-400">The empanelled insurer/TPA list is being updated. Please contact the hospital insurance desk at the number below for current network details.</p>`
        return
      }
      const insurers = items.filter((t) => t.type === 'insurer')
      const tpas = items.filter((t) => t.type === 'tpa')
      container.innerHTML = [
        insurers.length ? `<h3 class="mb-3 mt-2 text-lg font-semibold" style="color: var(--color-heading)">Empanelled Insurers</h3><div class="grid gap-4 sm:grid-cols-2">${insurers.map(card).join('')}</div>` : '',
        tpas.length ? `<h3 class="mb-3 mt-8 text-lg font-semibold" style="color: var(--color-heading)">Third-Party Administrators (TPAs)</h3><div class="grid gap-4 sm:grid-cols-2">${tpas.map(card).join('')}</div>` : '',
      ].join('')
    })
    .catch(() => {
      container.innerHTML = `<p class="text-sm text-gray-600 dark:text-slate-400">The insurer/TPA list could not be loaded. Please contact our insurance desk for assistance.</p>`
    })
}
