import { getAdminConfig, adminCollections, type FieldConfig, type CollectionConfig } from '../lib/admin/config'

const TOKEN_KEY = 'mj-admin-token'
const USER_KEY = 'mj-admin-user'

function token(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function esc(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function getPath(obj: unknown, key: string): unknown {
  return key.split('.').reduce((o: unknown, k) => (o === null || o === undefined ? undefined : (o as Record<string, unknown>)[k]), obj)
}

function itemId(item: Record<string, unknown>): string {
  return String(item.id ?? item.slug ?? '')
}

function unflatten(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('.')
    let node = out
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i]
      if (typeof node[p] !== 'object' || node[p] === null) node[p] = {}
      node = node[p] as Record<string, unknown>
    }
    node[parts[parts.length - 1]] = value
  }
  return out
}

function flattenForForm(item: Record<string, unknown>, fields: FieldConfig[]): Record<string, unknown> {
  const flat: Record<string, unknown> = {}
  for (const f of fields) {
    flat[f.key] = getPath(item, f.key)
  }
  return flat
}

function parseValue(raw: string, field: FieldConfig): unknown {
  switch (field.type) {
    case 'number': {
      const n = Number(raw)
      return raw === '' || Number.isNaN(n) ? 0 : n
    }
    case 'toggle':
      return raw === 'on' || raw === 'true' || raw === '1'
    case 'list':
      return raw.split('\n').map((s) => s.trim()).filter(Boolean)
    case 'blocks':
      return raw.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
    default:
      return raw.trim()
  }
}

function serializeForForm(value: unknown, field: FieldConfig): string {
  if (value === undefined || value === null) return ''
  if (field.type === 'list' || field.type === 'blocks') return Array.isArray(value) ? value.join('\n') : String(value)
  if (field.type === 'toggle') return String(value)
  return String(value)
}

async function api(path: string, method = 'GET', body?: unknown): Promise<any> {
  const headers: Record<string, string> = {}
  const t = token()
  if (t) headers['Authorization'] = 'Bearer ' + t
  if (method !== 'GET') headers['Content-Type'] = 'application/json'
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401 && path !== '/api/admin/login') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    showLogin()
    throw new Error('unauthorized')
  }
  let data: any = null
  try {
    data = await res.json()
  } catch {
    /* no body */
  }
  if (!res.ok) {
    throw new Error(data?.error || 'Request failed')
  }
  return data
}

function fieldHtml(field: FieldConfig, value: unknown): string {
  const val = esc(serializeForForm(value, field))
  const req = field.required ? 'required' : ''
  const help = field.help ? `<p class="mt-1 text-xs text-gray-500 dark:text-slate-400">${esc(field.help)}</p>` : ''
  switch (field.type) {
    case 'textarea':
      return `<div><label class="mb-1 block text-sm font-medium">${esc(field.label)}</label><textarea name="${field.key}" rows="${field.rows || 4}" class="admin-input" ${req} placeholder="${esc(field.placeholder || '')}">${val}</textarea>${help}</div>`
    case 'blocks':
      return `<div><label class="mb-1 block text-sm font-medium">${esc(field.label)}</label><textarea name="${field.key}" rows="${field.rows || 10}" class="admin-input font-mono text-xs" ${req} placeholder="${esc(field.placeholder || '')}">${val}</textarea>${help}</div>`
    case 'number':
      return `<div><label class="mb-1 block text-sm font-medium">${esc(field.label)}</label><input type="number" name="${field.key}" value="${val}" class="admin-input" ${req} placeholder="${esc(field.placeholder || '')}" /><input type="hidden" name="__num__${field.key}" value="1" />${help}</div>`
    case 'date':
      return `<div><label class="mb-1 block text-sm font-medium">${esc(field.label)}</label><input type="date" name="${field.key}" value="${val}" class="admin-input" ${req} />${help}</div>`
    case 'select':
      return `<div><label class="mb-1 block text-sm font-medium">${esc(field.label)}</label><select name="${field.key}" class="admin-input" ${req}>${(field.options || [])
        .map((o) => `<option value="${esc(o)}" ${String(value) === String(o) ? 'selected' : ''}>${esc(o)}</option>`)
        .join('')}</select>${help}</div>`
    case 'toggle':
      return `<div class="flex items-center justify-between gap-4 rounded-sm border px-4 py-3 dark:border-night-border"><label class="text-sm font-medium">${esc(field.label)}</label><input type="checkbox" name="${field.key}" class="h-5 w-5 accent-brand-800" ${val === 'true' || val === 'on' ? 'checked' : ''} /></div>${help}`
    case 'list':
      return `<div><label class="mb-1 block text-sm font-medium">${esc(field.label)}</label><textarea name="${field.key}" rows="4" class="admin-input font-mono text-xs" placeholder="One per line">${val}</textarea>${help}</div>`
    default:
      return `<div><label class="mb-1 block text-sm font-medium">${esc(field.label)}</label><input type="text" name="${field.key}" value="${val}" class="admin-input" ${req} placeholder="${esc(field.placeholder || '')}" />${help}</div>`
  }
}

let rootEl: HTMLElement | null = null
let currentItems: any[] = []
let currentQuery = ''

function showLogin(message = ''): void {
  if (!rootEl) return
  rootEl.innerHTML = `
    <div class="mx-auto mt-4 max-w-md px-1 sm:mt-10">
      <div class="card p-5 sm:p-8">
        <div class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md bg-black"><img src="/logo.png" alt="" class="h-14 w-14 object-contain" /></div>
        <h1 class="mt-4 text-xl font-bold" style="color: var(--color-heading)">Admin Sign In</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-slate-400">Sign in to manage appointments, doctors, blog posts and more.</p>
        ${message ? `<p class="mt-3 rounded-sm bg-danger-500/10 px-3 py-2 text-sm text-danger-600">${esc(message)}</p>` : ''}
        <form id="admin-login-form" class="mt-6 space-y-4">
          <div><label class="mb-1 block text-sm font-medium">Username</label><input type="text" id="admin-username" class="admin-input" autocomplete="username" required /></div>
          <div><label class="mb-1 block text-sm font-medium">Password</label><input type="password" id="admin-password" class="admin-input" autocomplete="current-password" required /></div>
          <button type="submit" class="btn-primary w-full justify-center">Sign In</button>
        </form>
      </div>
    </div>
  `
  document.getElementById('admin-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const username = (document.getElementById('admin-username') as HTMLInputElement).value
    const password = (document.getElementById('admin-password') as HTMLInputElement).value
    try {
      const data = await api('/api/admin/login', 'POST', { username, password })
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, data.username)
      await render()
    } catch (err: any) {
      showLogin(err.message || 'Login failed')
    }
  })
}

function statusBadge(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-warm-500/15 text-warm-600 dark:text-warm-400',
    confirmed: 'bg-heal-50 text-heal-700 dark:bg-heal-500/10 dark:text-heal-500',
    completed: 'bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300',
    cancelled: 'bg-danger-500/10 text-danger-600 dark:text-danger-500',
    upcoming: 'bg-heal-50 text-heal-700 dark:bg-heal-500/10 dark:text-heal-500',
    past: 'bg-gray-100 text-gray-600 dark:bg-night-border dark:text-slate-400',
  }
  return `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-600 dark:bg-night-border dark:text-slate-400'}">${esc(status)}</span>`
}

function cellHtml(item: Record<string, unknown>, key: string, cfg: CollectionConfig): string {
  const value = getPath(item, key)
  if (key === 'status') {
    const select = cfg.statusField === 'status'
      ? `<select data-status-change="${itemId(item)}" class="admin-select ml-2 text-xs">${(cfg.statusOptions || []).map((o) => `<option value="${o}" ${value === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`
      : ''
    return statusBadge(String(value || 'pending')) + select
  }
  if (key === 'featured' || key === 'availableToday') {
    return value ? `<span class="inline-flex items-center rounded-full bg-heal-50 px-2.5 py-0.5 text-xs font-semibold text-heal-700 dark:bg-heal-500/10 dark:text-heal-500">Yes</span>` : `<span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 dark:bg-night-border dark:text-slate-400">No</span>`
  }
  if (key === 'createdAt') {
    const d = new Date(String(value))
    return isNaN(d.getTime()) ? esc(value) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  if (key === 'date') return esc(value)
  if (Array.isArray(value)) return esc(value.join(', '))
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value === undefined || value === null || value === '') return '<span class="text-gray-400">—</span>'
  const s = String(value)
  return s.length > 60 ? esc(s.slice(0, 60)) + '…' : esc(s)
}

function tableHtml(cfg: CollectionConfig): string {
  const rows = currentItems
  return `
    <div class="overflow-x-auto rounded-md border dark:border-night-border">
      <table class="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr class="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-night-border dark:bg-night-surface dark:text-slate-400">
            <th class="px-4 py-3 font-semibold">#</th>
            ${cfg.columns.map((c) => `<th class="px-4 py-3 font-semibold">${esc(c)}</th>`).join('')}
            <th class="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length === 0 ? `<tr><td colspan="${cfg.columns.length + 2}" class="px-4 py-12 text-center text-gray-500 dark:text-slate-400">No items found${currentQuery ? ' for your search' : ''}.</td></tr>` : rows.map((item, i) => {
            const id = itemId(item)
            return `<tr class="border-b last:border-0 hover:bg-gray-50 dark:border-night-border dark:hover:bg-night-surface">
              <td class="px-4 py-3 text-gray-400">${i + 1}</td>
              ${cfg.columns.map((c) => `<td class="px-4 py-3 align-top">${cellHtml(item, c, cfg)}</td>`).join('')}
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  ${cfg.edit !== false ? `<button type="button" data-edit="${esc(id)}" class="rounded-sm border px-2.5 py-1.5 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-50 dark:border-night-border dark:text-brand-400 dark:hover:bg-night-surface">Edit</button>` : ''}
                  ${cfg.remove !== false ? `<button type="button" data-delete="${esc(id)}" class="rounded-sm border px-2.5 py-1.5 text-xs font-semibold text-danger-600 transition-colors hover:bg-danger-500/10 dark:border-night-border">Delete</button>` : ''}
                </div>
              </td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>
  `
}

function showCollection(name: string): void {
  const cfg = getAdminConfig(name)
  if (!cfg || !rootEl) return
  rootEl.innerHTML = `
    <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight" style="color: var(--color-heading)">${esc(cfg.label)}</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-slate-400">${esc(cfg.description)}</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative">
          <input type="search" id="admin-search" class="admin-input w-56" placeholder="Search ${esc(cfg.label.toLowerCase())}..." value="${esc(currentQuery)}" />
        </div>
        ${cfg.create !== false ? `<button type="button" id="admin-add" class="btn-primary">+ Add New</button>` : ''}
      </div>
    </header>
    <div class="mb-4 text-sm text-gray-500 dark:text-slate-400" id="admin-count"></div>
    <div id="admin-table-wrap"></div>
  `
  document.getElementById('admin-add')?.addEventListener('click', () => openEditor(cfg, null))
  document.getElementById('admin-search')?.addEventListener('input', (e) => {
    currentQuery = (e.target as HTMLInputElement).value
    void renderTable(cfg)
  })
  void renderTable(cfg)
}

async function renderTable(cfg: CollectionConfig): Promise<void> {
  const data = await api(`/api/admin/${cfg.name}`)
  currentItems = data.items
  const q = currentQuery.trim().toLowerCase()
  if (q) {
    currentItems = currentItems.filter((item) => cfg.searchKeys.some((k) => {
      const v = getPath(item, k)
      return v !== undefined && v !== null && String(v).toLowerCase().includes(q)
    }))
  }
  const wrap = document.getElementById('admin-table-wrap')
  const count = document.getElementById('admin-count')
  if (wrap) wrap.innerHTML = tableHtml(cfg)
  if (count) count.textContent = `${currentItems.length} item${currentItems.length === 1 ? '' : 's'}`
  bindTableActions(cfg)
}

function bindTableActions(cfg: CollectionConfig): void {
  const wrap = document.getElementById('admin-table-wrap')
  if (!wrap) return
  wrap.querySelectorAll<HTMLElement>('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = currentItems.find((x) => itemId(x) === btn.dataset.edit)
      if (item) openEditor(cfg, item)
    })
  })
  wrap.querySelectorAll<HTMLElement>('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delete || ''
      if (!window.confirm('Delete this item? This cannot be undone.')) return
      api(`/api/admin/${cfg.name}/${encodeURIComponent(id)}`, 'DELETE')
        .then(() => renderTable(cfg))
        .catch((err) => window.alert(err.message))
    })
  })
  wrap.querySelectorAll<HTMLElement>('[data-status-change]').forEach((sel) => {
    sel.addEventListener('change', () => {
      const id = (sel as HTMLSelectElement).dataset.statusChange || ''
      api(`/api/admin/${cfg.name}/${encodeURIComponent(id)}`, 'PUT', { status: (sel as HTMLSelectElement).value })
        .then(() => renderTable(cfg))
        .catch((err) => window.alert(err.message))
    })
  })
}

function openEditor(cfg: CollectionConfig, item: Record<string, unknown> | null): void {
  const flat = flattenForForm(item || {}, cfg.fields)
  const isEdit = !!item
  const title = isEdit ? `Edit ${cfg.label.slice(0, -1)}` : `Add ${cfg.label.slice(0, -1)}`
  rootEl!.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10" id="editor-overlay">
      <div class="w-full max-w-2xl rounded-md bg-white shadow-card-xl dark:bg-night-surface">
        <div class="flex items-center justify-between border-b px-6 py-4 dark:border-night-border">
          <h2 class="text-lg font-semibold" style="color: var(--color-heading)">${esc(title)}</h2>
          <button type="button" data-close-editor class="rounded-sm p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-night-border" aria-label="Close"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <form id="editor-form" class="grid max-h-[70vh] gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
          ${cfg.fields.map((f) => `<div class="${f.type === 'textarea' || f.type === 'blocks' ? 'sm:col-span-2' : ''}">${fieldHtml(f, flat[f.key])}</div>`).join('')}
          <div class="flex items-center justify-end gap-3 border-t pt-4 sm:col-span-2 dark:border-night-border">
            <button type="button" data-close-editor class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">${isEdit ? 'Save Changes' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  `
  document.querySelectorAll('[data-close-editor]').forEach((btn) => btn.addEventListener('click', () => void renderCollection(cfg.name)))
  document.getElementById('editor-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) void renderCollection(cfg.name)
  })
  document.getElementById('editor-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const data: Record<string, unknown> = {}
    for (const field of cfg.fields) {
      const el = form.elements.namedItem(field.key) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
      if (!el) continue
      const value = el.type === 'checkbox' ? (el as HTMLInputElement).checked : el.value
      data[field.key] = parseValue(String(value ?? ''), field)
    }
    try {
      if (isEdit) {
        await api(`/api/admin/${cfg.name}/${encodeURIComponent(itemId(item!))}`, 'PUT', unflatten(data))
      } else {
        await api(`/api/admin/${cfg.name}`, 'POST', unflatten(data))
      }
      await renderCollection(cfg.name)
    } catch (err: any) {
      window.alert(err.message)
    }
  })
}

async function showDashboard(): Promise<void> {
  if (!rootEl) return
  const stats = await api('/api/admin/stats')
  const user = localStorage.getItem(USER_KEY) || 'admin'
  const cards = adminCollections.map((cfg) => `
    <a href="/admin/${cfg.name}" class="card card-hover flex items-center gap-4 p-5">
      <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconPath(cfg.icon)}</svg>
      </span>
      <div class="min-w-0">
        <p class="text-xl font-bold" style="color: var(--color-heading)">${stats.counts?.[cfg.name] ?? 0}</p>
        <p class="truncate text-sm text-gray-600 dark:text-slate-400">${esc(cfg.label)}</p>
      </div>
    </a>
  `).join('')

  const appointments = stats.counts?.appointments ? await api('/api/admin/appointments').then((d) => d.items).catch(() => []) : []

  rootEl.innerHTML = `
    <header class="mb-8">
      <p class="text-sm font-medium text-brand-800 dark:text-brand-400">Welcome back, ${esc(user)}</p>
      <h1 class="mt-1 text-3xl font-bold tracking-tight" style="color: var(--color-heading)">Admin Dashboard</h1>
      <p class="mt-2 max-w-2xl text-sm text-gray-600 dark:text-slate-400">Manage appointments, camp registrations, doctors, blog posts, health camps, services, FAQs and more. Changes are saved instantly and reflected on the public website.</p>
    </header>

    <div class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">${cards}</div>

    <div class="mt-10">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold" style="color: var(--color-heading)">Recent Appointment Requests</h2>
        <a href="/admin/appointments" class="text-sm font-semibold text-brand-800 hover:underline dark:text-brand-400">View all</a>
      </div>
      <div class="overflow-x-auto rounded-md border dark:border-night-border">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr class="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-night-border dark:bg-night-surface dark:text-slate-400">
              <th class="px-4 py-3 font-semibold">Patient</th>
              <th class="px-4 py-3 font-semibold">Doctor / Service</th>
              <th class="px-4 py-3 font-semibold">Date</th>
              <th class="px-4 py-3 font-semibold">Time</th>
              <th class="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            ${appointments.length === 0 ? '<tr><td colspan="5" class="px-4 py-10 text-center text-gray-500 dark:text-slate-400">No appointment requests yet.</td></tr>' : appointments.slice(0, 8).map((a: any) => `<tr class="border-b last:border-0 dark:border-night-border">
              <td class="px-4 py-3">${esc(a.patientName)}</td>
              <td class="px-4 py-3">${esc(a.doctor || a.service || '—')}</td>
              <td class="px-4 py-3">${esc(a.date)}</td>
              <td class="px-4 py-3">${esc(a.time)}</td>
              <td class="px-4 py-3">${statusBadge(a.status)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function iconPath(name: string): string {
  const paths: Record<string, string> = {
    calendar: '<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 9h16.5"/><rect x="3" y="5.25" width="18" height="15" rx="2.25"/>',
    clipboard: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>',
    chat: '<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>',
    mail: '<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>',
    'user-group': '<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.5"/><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 18.5a5.25 5.25 0 0110.5 0M15 18.5a4.5 4.5 0 016 0"/>',
    document: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 7.125v11.25a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V10.5"/>',
    heart: '<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>',
    building: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21"/>',
    camera: '<path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>',
    star: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>',
  }
  return paths[name] || '<circle cx="12" cy="12" r="8.25"/>'
}

async function renderCollection(name: string): Promise<void> {
  currentQuery = ''
  showCollection(name)
}

async function render(): Promise<void> {
  if (!rootEl) return
  if (!token()) {
    showLogin()
    return
  }
  try {
    if (rootEl.dataset.active === 'dashboard' || !getAdminConfig(rootEl.dataset.active || '')) {
      await showDashboard()
    } else {
      showCollection(rootEl.dataset.active!)
    }
  } catch (err: any) {
    if (err.message !== 'unauthorized') {
      rootEl.innerHTML = `<div class="card p-8 text-center"><p class="text-danger-600">${esc(err.message)}</p><button id="retry-admin" class="btn-primary mt-4">Try Again</button></div>`
      document.getElementById('retry-admin')?.addEventListener('click', () => void render())
    }
  }
}

export default function initAdmin(el: HTMLElement): void {
  rootEl = el
  void render()
}
