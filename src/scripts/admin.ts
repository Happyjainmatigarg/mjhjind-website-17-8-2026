import { getAdminConfig, adminCollections, adminPages, type FieldConfig, type CollectionConfig } from '../lib/admin/config'
import { hospital } from '../data/site'
import {
  api,
  currentUser,
  esc,
  getPath,
  getRoot,
  icon,
  itemId,
  setRoot,
  setUnauthorizedHandler,
  statusBadge,
  toast,
  token,
  uploadFile,
} from './admin/shared'
import { exportCsv, exportExcel, exportJson, exportPdf, exportWord, type ReportColumn, type ReportTable } from '../lib/export'

const TOKEN_KEY = 'mj-admin-token'
const USER_KEY = 'mj-admin-user'

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
  for (const f of fields) flat[f.key] = getPath(item, f.key)
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
  return String(value)
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
      return `<div><label class="mb-1 block text-sm font-medium">${esc(field.label)}</label><input type="number" name="${field.key}" value="${val}" class="admin-input" ${req} placeholder="${esc(field.placeholder || '')}" />${help}</div>`
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

function textField(name: string, label: string, value: unknown, opts: { type?: string; help?: string; placeholder?: string; required?: boolean } = {}): string {
  const help = opts.help ? `<p class="mt-1 text-xs text-gray-500 dark:text-slate-400">${esc(opts.help)}</p>` : ''
  return `<div><label class="mb-1 block text-sm font-medium">${esc(label)}</label><input type="${opts.type || 'text'}" name="${name}" value="${esc(value)}" class="admin-input" ${opts.required ? 'required' : ''} placeholder="${esc(opts.placeholder || '')}" autocomplete="off" />${help}</div>`
}

function selectField(name: string, label: string, value: unknown, options: string[], help = ''): string {
  return `<div><label class="mb-1 block text-sm font-medium">${esc(label)}</label><select name="${name}" class="admin-input">${options
    .map((o) => `<option value="${esc(o)}" ${String(value) === String(o) ? 'selected' : ''}>${esc(o)}</option>`)
    .join('')}</select>${help ? `<p class="mt-1 text-xs text-gray-500 dark:text-slate-400">${esc(help)}</p>` : ''}</div>`
}

function toggleField(name: string, label: string, checked: boolean, help = ''): string {
  return `<div class="flex items-center justify-between gap-4 rounded-sm border px-4 py-3 dark:border-night-border"><div><label class="text-sm font-medium">${esc(label)}</label>${help ? `<p class="text-xs text-gray-500 dark:text-slate-400">${esc(help)}</p>` : ''}</div><input type="checkbox" name="${name}" class="h-5 w-5 accent-brand-800" ${checked ? 'checked' : ''} /></div>`
}

function textareaField(name: string, label: string, value: unknown, rows = 3, help = ''): string {
  return `<div><label class="mb-1 block text-sm font-medium">${esc(label)}</label><textarea name="${name}" rows="${rows}" class="admin-input">${esc(value)}</textarea>${help ? `<p class="mt-1 text-xs text-gray-500 dark:text-slate-400">${esc(help)}</p>` : ''}</div>`
}

function pageHeader(title: string, description: string, action = ''): string {
  return `<header class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-tight" style="color: var(--color-heading)">${esc(title)}</h1>
      <p class="mt-1 max-w-2xl text-sm text-gray-600 dark:text-slate-400">${esc(description)}</p>
    </div>
    ${action ? `<div class="flex items-center gap-3">${action}</div>` : ''}
  </header>`
}

function showLogin(message = ''): void {
  const root = getRoot()
  if (!root) return
  root.innerHTML = `
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

/* ------------------------------------------------------------------ */
/* Collection management                                               */
/* ------------------------------------------------------------------ */

let currentItems: any[] = []
let currentQuery = ''

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

function rowActions(item: Record<string, unknown>, cfg: CollectionConfig): string {
  const id = itemId(item)
  const email = String(item.email || '')
  const notify = (cfg.name === 'appointments' || cfg.name === 'campRegistrations') && email
  return `<div class="flex flex-wrap items-center gap-2">
    ${notify ? `<button type="button" data-notify="confirm" data-id="${esc(id)}" class="rounded-sm border px-2.5 py-1.5 text-xs font-semibold text-heal-700 transition-colors hover:bg-heal-50 dark:border-night-border dark:text-heal-500 dark:hover:bg-night-surface">Confirm</button>` : ''}
    ${notify ? `<button type="button" data-notify="resend" data-id="${esc(id)}" class="rounded-sm border px-2.5 py-1.5 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-50 dark:border-night-border dark:text-brand-400 dark:hover:bg-night-surface">Resend</button>` : ''}
    <button type="button" data-print="${esc(id)}" class="rounded-sm border px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-night-border dark:text-slate-300 dark:hover:bg-night-surface">Print</button>
    ${cfg.edit !== false ? `<button type="button" data-edit="${esc(id)}" class="rounded-sm border px-2.5 py-1.5 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-50 dark:border-night-border dark:text-brand-400 dark:hover:bg-night-surface">Edit</button>` : ''}
    ${cfg.remove !== false ? `<button type="button" data-delete="${esc(id)}" class="rounded-sm border px-2.5 py-1.5 text-xs font-semibold text-danger-600 transition-colors hover:bg-danger-500/10 dark:border-night-border">Delete</button>` : ''}
  </div>`
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
          ${rows.length === 0 ? `<tr><td colspan="${cfg.columns.length + 2}" class="px-4 py-12 text-center text-gray-500 dark:text-slate-400">No items found${currentQuery ? ' for your search' : ''}.</td></tr>` : rows.map((item, i) => `
            <tr class="border-b last:border-0 hover:bg-gray-50 dark:border-night-border dark:hover:bg-night-surface">
              <td class="px-4 py-3 text-gray-400">${i + 1}</td>
              ${cfg.columns.map((c) => `<td class="px-4 py-3 align-top">${cellHtml(item, c, cfg)}</td>`).join('')}
              <td class="px-4 py-3">${rowActions(item, cfg)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `
}

function showCollection(name: string): void {
  const cfg = getAdminConfig(name)
  const root = getRoot()
  if (!cfg || !root) return
  root.innerHTML = `
    ${pageHeader(cfg.label, cfg.description, `
      <div class="relative"><input type="search" id="admin-search" class="admin-input w-56" placeholder="Search ${esc(cfg.label.toLowerCase())}..." value="${esc(currentQuery)}" /></div>
      ${cfg.create !== false ? '<button type="button" id="admin-add" class="btn-primary">+ Add New</button>' : ''}
    `)}
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

async function notifyRecord(collection: string, id: string, type: 'confirm' | 'resend'): Promise<void> {
  const label = type === 'resend' ? 'Resend confirmation email to this patient?' : 'Send confirmation email to this patient?'
  if (!window.confirm(label)) return
  try {
    const res = await api('/api/admin/notify', 'POST', { collection, id, type })
    toast(res.message || 'Email sent.')
  } catch (err: any) {
    toast(err.message || 'Could not send email.', 'error')
  }
}

function printRecord(item: Record<string, unknown>, cfg: CollectionConfig): void {
  const existing = document.getElementById('print-receipt')
  existing?.remove()
  const el = document.createElement('div')
  el.id = 'print-receipt'
  const rows = cfg.fields
    .map((f) => {
      const v = getPath(item, f.key)
      const text = Array.isArray(v) ? v.join(', ') : v === undefined || v === null || v === '' ? '—' : String(v)
      return `<tr><td>${esc(f.label)}</td><td>${esc(text)}</td></tr>`
    })
    .join('')
  el.innerHTML = `
    <div class="print-receipt-header">
      <div>
        <div class="print-receipt-brand">${esc(hospital.name)}</div>
        <div class="print-receipt-sub">${esc(hospital.address.line1)}, ${esc(hospital.address.city)}, ${esc(hospital.address.state)} — ${esc(hospital.address.pincode)}</div>
        <div class="print-receipt-sub">${esc(hospital.phones.appointment)} · ${esc(hospital.email)}</div>
      </div>
      <div class="print-receipt-badge">${esc(cfg.label.toUpperCase())}</div>
    </div>
    <div class="print-receipt-title">${esc(cfg.keyLabel)}: ${esc(itemId(item))}</div>
    <table class="print-receipt-table">${rows}</table>
    <p class="print-receipt-note">Computer-generated record printed from the ${esc(hospital.name)} admin panel on ${esc(new Date().toLocaleString('en-IN'))}.</p>
    <div class="print-receipt-footer">${esc(hospital.name)} · ${esc(hospital.phones.reception)} · ${esc(hospital.email)}</div>
  `
  document.body.appendChild(el)
  window.print()
  setTimeout(() => el.remove(), 500)
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
        .then(() => { toast('Item deleted.'); return renderTable(cfg) })
        .catch((err) => toast(err.message, 'error'))
    })
  })
  wrap.querySelectorAll<HTMLElement>('[data-status-change]').forEach((sel) => {
    sel.addEventListener('change', () => {
      const id = (sel as HTMLSelectElement).dataset.statusChange || ''
      api(`/api/admin/${cfg.name}/${encodeURIComponent(id)}`, 'PUT', { status: (sel as HTMLSelectElement).value })
        .then(() => { toast('Status updated.'); return renderTable(cfg) })
        .catch((err) => toast(err.message, 'error'))
    })
  })
  wrap.querySelectorAll<HTMLElement>('[data-notify]').forEach((btn) => {
    btn.addEventListener('click', () => void notifyRecord(cfg.name, btn.dataset.id || '', (btn.dataset.notify as 'confirm' | 'resend') || 'confirm'))
  })
  wrap.querySelectorAll<HTMLElement>('[data-print]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = currentItems.find((x) => itemId(x) === btn.dataset.print)
      if (item) printRecord(item, cfg)
    })
  })
}

function openEditor(cfg: CollectionConfig, item: Record<string, unknown> | null): void {
  const root = getRoot()
  if (!root) return
  const flat = flattenForForm(item || {}, cfg.fields)
  const isEdit = !!item
  const title = isEdit ? `Edit ${cfg.label.slice(0, -1)}` : `Add ${cfg.label.slice(0, -1)}`
  root.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10" id="editor-overlay">
      <div class="w-full max-w-2xl rounded-md bg-white shadow-card-xl dark:bg-night-surface">
        <div class="flex items-center justify-between border-b px-6 py-4 dark:border-night-border">
          <h2 class="text-lg font-semibold" style="color: var(--color-heading)">${esc(title)}</h2>
          <button type="button" data-close-editor class="rounded-sm p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-night-border" aria-label="Close">${icon('x', 20)}</button>
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
      if (isEdit) await api(`/api/admin/${cfg.name}/${encodeURIComponent(itemId(item!))}`, 'PUT', unflatten(data))
      else await api(`/api/admin/${cfg.name}`, 'POST', unflatten(data))
      toast(isEdit ? 'Changes saved.' : 'Item created.')
      await renderCollection(cfg.name)
    } catch (err: any) {
      toast(err.message, 'error')
    }
  })
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

async function showDashboard(): Promise<void> {
  const root = getRoot()
  if (!root) return
  const stats = await api('/api/admin/stats')
  const analytics = await api('/api/admin/analytics?range=30').catch(() => null)
  const cards = adminCollections.map((cfg) => `
    <a href="/admin/${cfg.name}" class="card card-hover flex items-center gap-4 p-5">
      <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300">${icon(cfg.icon, 22)}</span>
      <div class="min-w-0">
        <p class="text-xl font-bold" style="color: var(--color-heading)">${stats.counts?.[cfg.name] ?? 0}</p>
        <p class="truncate text-sm text-gray-600 dark:text-slate-400">${esc(cfg.label)}</p>
      </div>
    </a>
  `).join('')

  const kpis = analytics ? `
    <div class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
      ${[
        { label: 'Pending appointments', value: analytics.kpis.pending, href: '/admin/appointments' },
        { label: 'Confirmed appointments', value: analytics.kpis.confirmed, href: '/admin/appointments' },
        { label: 'Contact messages', value: analytics.kpis.unreadContacts, href: '/admin/contacts' },
        { label: 'Newsletter subscribers', value: analytics.kpis.subscribers, href: '/admin/newsletter' },
      ].map((k) => `
        <a href="${k.href}" class="card card-hover p-5">
          <p class="text-2xl font-bold" style="color: var(--color-heading)">${k.value}</p>
          <p class="mt-1 text-sm text-gray-600 dark:text-slate-400">${esc(k.label)}</p>
        </a>`).join('')}
    </div>` : ''

  const appointments = stats.counts?.appointments ? await api('/api/admin/appointments').then((d) => d.items).catch(() => []) : []

  root.innerHTML = `
    <header class="mb-8">
      <p class="text-sm font-medium text-brand-800 dark:text-brand-400">Welcome back, ${esc(currentUser())}</p>
      <h1 class="mt-1 text-3xl font-bold tracking-tight" style="color: var(--color-heading)">Admin Dashboard</h1>
      <p class="mt-2 max-w-2xl text-sm text-gray-600 dark:text-slate-400">Manage appointments, camp registrations, doctors, blog posts, camps, services, FAQs and more. Changes are saved instantly and reflected on the public website.</p>
    </header>

    <div class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">${cards}</div>
    ${kpis}

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

/* ------------------------------------------------------------------ */
/* Email & notifications settings                                      */
/* ------------------------------------------------------------------ */

async function showSettings(): Promise<void> {
  const root = getRoot()
  if (!root) return
  const { settings: s } = await api('/api/admin/settings')
  root.innerHTML = `
    ${pageHeader('Email & Notifications', 'Configure how appointment confirmations and enquiry alerts are delivered. Secrets are encrypted at rest and never shown again.')}
    ${s.configured
      ? `<div class="mb-6 rounded-sm bg-heal-50 px-4 py-3 text-sm text-heal-800 dark:bg-heal-500/10 dark:text-heal-400">Email is active using the <strong>${esc(s.transport.toUpperCase())}</strong> transport.</div>`
      : `<div class="mb-6 rounded-sm bg-warm-500/10 px-4 py-3 text-sm text-warm-700 dark:text-warm-400">Email is not configured yet. Add an API key or SMTP credentials, then save and send a test email.</div>`}
    <form id="settings-form" class="grid gap-6 lg:grid-cols-3">
      <div class="card space-y-4 p-6 lg:col-span-2">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Delivery</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          ${selectField('mode', 'Mode', s.mode, ['auto', 'api', 'smtp'], 'Auto uses the API key when present, otherwise SMTP.')}
          ${selectField('provider', 'API Provider', s.provider, ['resend', 'sendgrid', 'brevo'])}
          ${textField('apiKey', 'API Key', '', { type: 'password', placeholder: s.apiKeySet ? '•••••••• saved (leave blank to keep)' : 'Paste provider API key', help: s.apiKeySet ? 'A key is already saved.' : '' })}
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="clearApiKey" class="h-4 w-4 accent-brand-800" /> Remove saved API key</label>
        </div>
        <h2 class="border-t pt-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:border-night-border dark:text-slate-400">SMTP (optional)</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          ${textField('smtpHost', 'SMTP Host', s.smtpHost, { placeholder: 'smtp.gmail.com' })}
          ${textField('smtpPort', 'SMTP Port', s.smtpPort, { type: 'number' })}
          ${textField('smtpUser', 'SMTP Username', s.smtpUser)}
          ${textField('smtpPass', 'SMTP Password', '', { type: 'password', placeholder: s.smtpPassSet ? '•••••••• saved (leave blank to keep)' : 'App password' })}
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="smtpSecure" class="h-4 w-4 accent-brand-800" ${s.smtpSecure ? 'checked' : ''} /> Use implicit TLS (port 465)</label>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="clearSmtpPass" class="h-4 w-4 accent-brand-800" /> Remove saved SMTP password</label>
        </div>
      </div>
      <div class="card space-y-4 p-6">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Sender & Recipients</h2>
        ${textField('fromName', 'From Name', s.fromName)}
        ${textField('fromEmail', 'From Email', s.fromEmail, { type: 'email', required: true })}
        ${textareaField('adminNotifyEmails', 'Admin Notification Emails', s.adminNotifyEmails, 3, 'Comma-separated list of hospital staff inboxes.')}
        <div class="border-t pt-4 dark:border-night-border">
          <button type="submit" class="btn-primary w-full justify-center">Save Settings</button>
        </div>
        <div class="rounded-sm border border-dashed p-3 dark:border-night-border">
          <label class="mb-1 block text-sm font-medium">Send a test email</label>
          <input type="email" id="test-to" class="admin-input" placeholder="${esc(s.fromEmail)}" />
          <button type="button" id="send-test" class="btn-secondary mt-2 w-full justify-center">Send Test Email</button>
        </div>
      </div>
    </form>
  `
  document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const value = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | null)?.value ?? ''
    const checked = (n: string) => Boolean((form.elements.namedItem(n) as HTMLInputElement | null)?.checked)
    try {
      await api('/api/admin/settings', 'PUT', {
        mode: value('mode'),
        provider: value('provider'),
        apiKey: value('apiKey'),
        clearApiKey: checked('clearApiKey'),
        smtpHost: value('smtpHost'),
        smtpPort: Number(value('smtpPort')) || 587,
        smtpSecure: checked('smtpSecure'),
        smtpUser: value('smtpUser'),
        smtpPass: value('smtpPass'),
        clearSmtpPass: checked('clearSmtpPass'),
        fromName: value('fromName'),
        fromEmail: value('fromEmail'),
        adminNotifyEmails: value('adminNotifyEmails'),
      })
      toast('Email settings saved.')
      await showSettings()
    } catch (err: any) {
      toast(err.message, 'error')
    }
  })
  document.getElementById('send-test')?.addEventListener('click', async () => {
    const to = (document.getElementById('test-to') as HTMLInputElement).value.trim()
    try {
      const res = await api('/api/admin/settings/test', 'POST', { to })
      toast(`Test email sent via ${res.transport.toUpperCase()} to ${res.to}.`)
    } catch (err: any) {
      toast(err.message, 'error')
    }
  })
}

/* ------------------------------------------------------------------ */
/* Site & contact settings                                             */
/* ------------------------------------------------------------------ */

async function showSite(): Promise<void> {
  const root = getRoot()
  if (!root) return
  const { settings: s } = await api('/api/admin/site-settings')
  const social: any[] = s.social || []
  root.innerHTML = `
    ${pageHeader('Site & Contact', 'These details appear in the website header, footer, contact page and structured data.')}
    <form id="site-form" class="grid gap-6 lg:grid-cols-2">
      <div class="card space-y-4 p-6">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Contact Details</h2>
        ${textField('email', 'Public Email', s.email, { type: 'email', required: true })}
        <div class="grid gap-4 sm:grid-cols-2">
          ${textField('phones.emergency', 'Emergency', s.phones.emergency)}
          ${textField('phones.ambulance', 'Ambulance', s.phones.ambulance)}
          ${textField('phones.appointment', 'Appointment', s.phones.appointment)}
          ${textField('phones.reception', 'Reception', s.phones.reception)}
        </div>
        <h2 class="border-t pt-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:border-night-border dark:text-slate-400">Address</h2>
        ${textField('address.line1', 'Address Line 1', s.address.line1)}
        ${textField('address.line2', 'Address Line 2', s.address.line2)}
        <div class="grid gap-4 sm:grid-cols-3">
          ${textField('address.city', 'City', s.address.city)}
          ${textField('address.state', 'State', s.address.state)}
          ${textField('address.pincode', 'PIN Code', s.address.pincode)}
        </div>
      </div>
      <div class="card space-y-4 p-6">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Timings</h2>
        ${textField('hours.opd', 'OPD Hours', s.hours.opd, { placeholder: '9:00 AM – 2:00 PM' })}
        ${textField('hours.emergency', 'Emergency', s.hours.emergency)}
        ${textField('hours.visiting', 'Visiting Hours', s.hours.visiting)}
        ${textField('hours.pharmacy', 'Pharmacy', s.hours.pharmacy)}
        <h2 class="border-t pt-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:border-night-border dark:text-slate-400">Social Links</h2>
        ${social.map((link) => `
          <div class="rounded-sm border p-3 dark:border-night-border">
            <label class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-2 text-sm font-medium">${icon(link.key === 'x' ? 'x-social' : link.icon, 18)} ${esc(link.label)}</span>
              <input type="checkbox" name="social.${link.key}.enabled" class="h-5 w-5 accent-brand-800" ${link.enabled ? 'checked' : ''} />
            </label>
            <input type="url" name="social.${link.key}.url" value="${esc(link.url)}" class="admin-input mt-2" placeholder="https://" />
            <input type="hidden" name="social.${link.key}.key" value="${esc(link.key)}" />
          </div>`).join('')}
        <button type="submit" class="btn-primary w-full justify-center">Save Site Settings</button>
      </div>
    </form>
  `
  document.getElementById('site-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const val = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | null)?.value ?? ''
    const chk = (n: string) => Boolean((form.elements.namedItem(n) as HTMLInputElement | null)?.checked)
    try {
      await api('/api/admin/site-settings', 'PUT', {
        email: val('email'),
        phones: { emergency: val('phones.emergency'), ambulance: val('phones.ambulance'), appointment: val('phones.appointment'), reception: val('phones.reception') },
        address: { line1: val('address.line1'), line2: val('address.line2'), city: val('address.city'), state: val('address.state'), pincode: val('address.pincode') },
        hours: { opd: val('hours.opd'), emergency: val('hours.emergency'), visiting: val('hours.visiting'), pharmacy: val('hours.pharmacy') },
        social: social.map((link) => ({ key: link.key, url: val(`social.${link.key}.url`), enabled: chk(`social.${link.key}.enabled`) })),
      })
      toast('Site settings saved.')
      await showSite()
    } catch (err: any) {
      toast(err.message, 'error')
    }
  })
}

/* ------------------------------------------------------------------ */
/* Media library                                                       */
/* ------------------------------------------------------------------ */

function mediaCard(m: any): string {
  return `<div class="card overflow-hidden">
    <div class="flex h-36 items-center justify-center bg-gray-100 dark:bg-night-surface">
      <img src="${esc(m.url || `/api/media/${m.id}`)}" alt="${esc(m.alt || m.filename)}" class="h-full w-full object-contain" loading="lazy" />
    </div>
    <div class="space-y-2 p-3">
      <p class="truncate text-sm font-medium" title="${esc(m.filename)}">${esc(m.filename)}</p>
      <p class="text-xs text-gray-500 dark:text-slate-400">${(m.size / 1024).toFixed(0)} KB · ${esc(m.mime)}</p>
      <label class="flex items-center justify-between gap-2 text-xs">
        <span class="text-gray-600 dark:text-slate-400">Visible on site</span>
        <input type="checkbox" data-media-visible="${esc(m.id)}" class="h-4 w-4 accent-brand-800" ${m.visible ? 'checked' : ''} />
      </label>
      <div class="flex items-center gap-2">
        <input type="text" data-media-alt="${esc(m.id)}" value="${esc(m.alt)}" class="admin-input text-xs" placeholder="Alt text" />
        <button type="button" data-media-delete="${esc(m.id)}" class="rounded-sm border px-2 py-1.5 text-xs font-semibold text-danger-600 hover:bg-danger-500/10 dark:border-night-border">Delete</button>
      </div>
    </div>
  </div>`
}

async function showMedia(): Promise<void> {
  const root = getRoot()
  if (!root) return
  const { items } = await api('/api/admin/media')
  root.innerHTML = `
    ${pageHeader('Media Library', 'Upload images up to 4 MB (PNG, JPEG, WebP, GIF, AVIF or SVG). Hidden images stop being served on the public site.')}
    <div class="card mb-8 p-6">
      <form id="media-form" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="sm:col-span-2 lg:col-span-1"><label class="mb-1 block text-sm font-medium">Image file</label><input type="file" name="file" accept="image/*" class="admin-input" required /></div>
        ${textField('alt', 'Alt text', '', { placeholder: 'Describe the image' })}
        ${textField('folder', 'Folder', 'general', { placeholder: 'e.g. gallery' })}
        <div class="flex items-end">${toggleField('visible', 'Visible on site', true)}</div>
        <div class="sm:col-span-2 lg:col-span-4"><button type="submit" class="btn-primary">Upload Image</button></div>
      </form>
    </div>
    <div id="media-grid" class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      ${items.length === 0 ? '<p class="col-span-full py-12 text-center text-gray-500 dark:text-slate-400">No media uploaded yet.</p>' : items.map(mediaCard).join('')}
    </div>
  `
  document.getElementById('media-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const fileInput = form.elements.namedItem('file') as HTMLInputElement
    if (!fileInput.files?.[0]) return
    const fd = new FormData()
    fd.append('file', fileInput.files[0])
    fd.append('alt', (form.elements.namedItem('alt') as HTMLInputElement).value)
    fd.append('folder', (form.elements.namedItem('folder') as HTMLInputElement).value)
    fd.append('visible', (form.elements.namedItem('visible') as HTMLInputElement).checked ? 'true' : 'false')
    try {
      await uploadFile('/api/admin/media', fd)
      toast('Image uploaded.')
      await showMedia()
    } catch (err: any) {
      toast(err.message, 'error')
    }
  })
  root.querySelectorAll<HTMLElement>('[data-media-visible]').forEach((el) => {
    el.addEventListener('change', async () => {
      try {
        await api(`/api/admin/media/${el.dataset.mediaVisible}`, 'PUT', { visible: (el as HTMLInputElement).checked })
        toast('Visibility updated.')
      } catch (err: any) {
        toast(err.message, 'error')
      }
    })
  })
  root.querySelectorAll<HTMLElement>('[data-media-alt]').forEach((el) => {
    el.addEventListener('change', async () => {
      try {
        await api(`/api/admin/media/${el.dataset.mediaAlt}`, 'PUT', { alt: (el as HTMLInputElement).value })
        toast('Alt text saved.')
      } catch (err: any) {
        toast(err.message, 'error')
      }
    })
  })
  root.querySelectorAll<HTMLElement>('[data-media-delete]').forEach((el) => {
    el.addEventListener('click', async () => {
      if (!window.confirm('Delete this image permanently?')) return
      try {
        await api(`/api/admin/media/${el.dataset.mediaDelete}`, 'DELETE')
        toast('Image deleted.')
        await showMedia()
      } catch (err: any) {
        toast(err.message, 'error')
      }
    })
  })
}

/* ------------------------------------------------------------------ */
/* Insurance & TPA                                                     */
/* ------------------------------------------------------------------ */

async function showTpas(): Promise<void> {
  const root = getRoot()
  if (!root) return
  const { items } = await api('/api/admin/tpas')
  root.innerHTML = `
    ${pageHeader('Insurance & TPA', 'Cashless insurers and third-party administrators. Only active entries are shown publicly.', '<button type="button" id="tpa-add" class="btn-primary">+ Add Entry</button>')}
    <div class="overflow-x-auto rounded-md border dark:border-night-border">
      <table class="w-full min-w-[720px] text-left text-sm">
        <thead><tr class="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-night-border dark:bg-night-surface dark:text-slate-400">
          <th class="px-4 py-3 font-semibold">Logo</th><th class="px-4 py-3 font-semibold">Name</th><th class="px-4 py-3 font-semibold">Type</th><th class="px-4 py-3 font-semibold">Helpline</th><th class="px-4 py-3 font-semibold">Cashless</th><th class="px-4 py-3 font-semibold">Active</th><th class="px-4 py-3 font-semibold">Actions</th>
        </tr></thead>
        <tbody>${items.length === 0 ? '<tr><td colspan="7" class="px-4 py-12 text-center text-gray-500 dark:text-slate-400">No insurers or TPAs added yet.</td></tr>' : items.map((t: any) => `<tr class="border-b last:border-0 dark:border-night-border">
          <td class="px-4 py-3">${t.logo ? `<img src="${esc(t.logo)}" alt="" class="h-8 w-16 object-contain" />` : '<span class="text-gray-400">—</span>'}</td>
          <td class="px-4 py-3 font-medium">${esc(t.name)}</td>
          <td class="px-4 py-3">${esc(t.type === 'tpa' ? 'TPA' : 'Insurer')}</td>
          <td class="px-4 py-3">${esc(t.helpline || '—')}</td>
          <td class="px-4 py-3">${t.cashless ? 'Yes' : 'No'}</td>
          <td class="px-4 py-3">${t.active ? 'Yes' : 'No'}</td>
          <td class="px-4 py-3"><div class="flex items-center gap-2">
            <button type="button" data-tpa-edit="${esc(t.id)}" class="rounded-sm border px-2.5 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50 dark:border-night-border dark:text-brand-400">Edit</button>
            <button type="button" data-tpa-delete="${esc(t.id)}" class="rounded-sm border px-2.5 py-1.5 text-xs font-semibold text-danger-600 hover:bg-danger-500/10 dark:border-night-border">Delete</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
  `
  document.getElementById('tpa-add')?.addEventListener('click', () => openTpaEditor(items, null))
  root.querySelectorAll<HTMLElement>('[data-tpa-edit]').forEach((btn) => btn.addEventListener('click', () => openTpaEditor(items, items.find((t: any) => t.id === btn.dataset.tpaEdit))))
  root.querySelectorAll<HTMLElement>('[data-tpa-delete]').forEach((btn) => btn.addEventListener('click', async () => {
    if (!window.confirm('Delete this insurer/TPA entry?')) return
    try {
      await api(`/api/admin/tpas/${btn.dataset.tpaDelete}`, 'DELETE')
      toast('Entry deleted.')
      await showTpas()
    } catch (err: any) {
      toast(err.message, 'error')
    }
  }))
}

function openTpaEditor(_items: any[], t: any | null): void {
  const root = getRoot()
  if (!root) return
  const isEdit = !!t
  root.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10" id="editor-overlay">
      <div class="w-full max-w-xl rounded-md bg-white shadow-card-xl dark:bg-night-surface">
        <div class="flex items-center justify-between border-b px-6 py-4 dark:border-night-border">
          <h2 class="text-lg font-semibold" style="color: var(--color-heading)">${isEdit ? 'Edit' : 'Add'} Insurer / TPA</h2>
          <button type="button" data-close-editor class="rounded-sm p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-night-border" aria-label="Close">${icon('x', 20)}</button>
        </div>
        <form id="tpa-form" class="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <div class="sm:col-span-2">${textField('name', 'Name', t?.name || '', { required: true, placeholder: 'e.g. Star Health Insurance' })}</div>
          ${selectField('type', 'Type', t?.type || 'insurer', ['insurer', 'tpa'])}
          ${textField('helpline', 'Helpline', t?.helpline || '')}
          ${textField('email', 'Email', t?.email || '', { type: 'email' })}
          <div class="sm:col-span-2">${textField('logo', 'Logo URL or media path', t?.logo || '', { placeholder: '/api/media/IMG-XXXX or https://...' })}</div>
          <div class="sm:col-span-2">${textareaField('notes', 'Notes', t?.notes || '', 3)}</div>
          ${toggleField('cashless', 'Cashless facility', t?.cashless ?? true, 'Shown as a cashless network hospital')}
          ${toggleField('active', 'Show on website', t?.active ?? true)}
          <div class="flex items-center justify-end gap-3 border-t pt-4 sm:col-span-2 dark:border-night-border">
            <button type="button" data-close-editor class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">${isEdit ? 'Save Changes' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  `
  document.querySelectorAll('[data-close-editor]').forEach((btn) => btn.addEventListener('click', () => void showTpas()))
  document.getElementById('editor-overlay')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) void showTpas() })
  document.getElementById('tpa-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const val = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | null)?.value ?? ''
    const chk = (n: string) => Boolean((form.elements.namedItem(n) as HTMLInputElement | null)?.checked)
    const payload = { name: val('name'), type: val('type'), helpline: val('helpline'), email: val('email'), logo: val('logo'), notes: val('notes'), cashless: chk('cashless'), active: chk('active') }
    try {
      if (isEdit) await api(`/api/admin/tpas/${t.id}`, 'PUT', payload)
      else await api('/api/admin/tpas', 'POST', payload)
      toast(isEdit ? 'Entry updated.' : 'Entry added.')
      await showTpas()
    } catch (err: any) {
      toast(err.message, 'error')
    }
  })
}

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

async function showPayment(): Promise<void> {
  const root = getRoot()
  if (!root) return
  const { settings: s } = await api('/api/admin/payment')
  root.innerHTML = `
    ${pageHeader('Payments', 'Optional online payment for appointment bookings. Secrets are encrypted at rest. Pay-at-hospital remains the default.')}
    <form id="payment-form" class="grid gap-6 lg:grid-cols-2">
      <div class="card space-y-4 p-6">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Gateway</h2>
        ${toggleField('enabled', 'Enable online payment', s.enabled, 'Off = patients pay at reception')}
        ${selectField('provider', 'Provider', s.provider, ['offline', 'razorpay', 'payu', 'phonepe', 'cashfree', 'stripe'])}
        ${selectField('mode', 'Mode', s.mode, ['test', 'live'])}
        ${textField('keyId', 'Key ID / Merchant ID', s.keyId)}
        ${textField('keySecret', 'Key Secret', '', { type: 'password', placeholder: s.keySecretSet ? '•••••••• saved (leave blank to keep)' : 'Gateway secret' })}
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="clearKeySecret" class="h-4 w-4 accent-brand-800" /> Remove saved secret</label>
      </div>
      <div class="card space-y-4 p-6">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Patient Instructions</h2>
        ${textField('upiId', 'UPI ID (optional)', s.upiId)}
        ${textareaField('instructions', 'Payment instructions', s.instructions, 6)}
        <button type="submit" class="btn-primary w-full justify-center">Save Payment Settings</button>
        <p class="text-xs text-gray-500 dark:text-slate-400">Note: gateway checkout for online collection must be completed on the server with a live merchant account. Until then, patients see the instructions above.</p>
      </div>
    </form>
  `
  document.getElementById('payment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const val = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | null)?.value ?? ''
    const chk = (n: string) => Boolean((form.elements.namedItem(n) as HTMLInputElement | null)?.checked)
    try {
      await api('/api/admin/payment', 'PUT', {
        enabled: chk('enabled'), provider: val('provider'), mode: val('mode'),
        keyId: val('keyId'), keySecret: val('keySecret'), clearKeySecret: chk('clearKeySecret'),
        upiId: val('upiId'), instructions: val('instructions'),
      })
      toast('Payment settings saved.')
      await showPayment()
    } catch (err: any) {
      toast(err.message, 'error')
    }
  })
}

/* ------------------------------------------------------------------ */
/* Activity log                                                        */
/* ------------------------------------------------------------------ */

let activityQuery = ''

async function showActivity(): Promise<void> {
  const root = getRoot()
  if (!root) return
  const data = await api(`/api/admin/activity?limit=200&q=${encodeURIComponent(activityQuery)}`)
  root.innerHTML = `
    ${pageHeader('Activity Log', 'Immutable audit trail of admin sign-ins and record changes.', '<button type="button" id="activity-clear" class="btn-secondary">Clear Log</button>')}
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <input type="search" id="activity-search" class="admin-input max-w-xs" placeholder="Search activity..." value="${esc(activityQuery)}" />
      <span class="text-sm text-gray-500 dark:text-slate-400">${data.total} entr${data.total === 1 ? 'y' : 'ies'}</span>
    </div>
    <div class="overflow-x-auto rounded-md border dark:border-night-border">
      <table class="w-full min-w-[720px] text-left text-sm">
        <thead><tr class="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-night-border dark:bg-night-surface dark:text-slate-400">
          <th class="px-4 py-3 font-semibold">When</th><th class="px-4 py-3 font-semibold">User</th><th class="px-4 py-3 font-semibold">Action</th><th class="px-4 py-3 font-semibold">Summary</th>
        </tr></thead>
        <tbody>${data.items.length === 0 ? '<tr><td colspan="4" class="px-4 py-12 text-center text-gray-500 dark:text-slate-400">No activity recorded yet.</td></tr>' : data.items.map((a: any) => `<tr class="border-b last:border-0 dark:border-night-border">
          <td class="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-slate-400">${esc(new Date(a.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</td>
          <td class="px-4 py-3">${esc(a.user)}</td>
          <td class="px-4 py-3"><span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-300">${esc(a.action)}</span></td>
          <td class="px-4 py-3">${esc(a.summary)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
  `
  document.getElementById('activity-search')?.addEventListener('input', (e) => {
    activityQuery = (e.target as HTMLInputElement).value
    window.clearTimeout((window as any).__mjActivityTimer)
    ;(window as any).__mjActivityTimer = window.setTimeout(() => void showActivity(), 350)
  })
  document.getElementById('activity-clear')?.addEventListener('click', async () => {
    if (!window.confirm('Clear the entire activity log? This cannot be undone.')) return
    try {
      await api('/api/admin/activity', 'DELETE')
      toast('Activity log cleared.')
      await showActivity()
    } catch (err: any) {
      toast(err.message, 'error')
    }
  })
}

/* ------------------------------------------------------------------ */
/* Analytics                                                           */
/* ------------------------------------------------------------------ */

function barChart(series: any[], keys: { key: string; color: string }[]): string {
  const max = Math.max(1, ...series.map((row) => keys.reduce((sum, k) => sum + (row[k.key] || 0), 0)))
  return `<div class="flex items-end gap-1 overflow-x-auto pb-2">${series.map((row) => {
    const total = keys.reduce((sum, k) => sum + (row[k.key] || 0), 0)
    const height = Math.round((total / max) * 120)
    return `<div class="flex min-w-[14px] flex-1 flex-col items-center justify-end" title="${esc(row.date)} · ${total}">
      <div class="w-full rounded-t-sm bg-brand-700/80" style="height:${Math.max(height, total ? 4 : 1)}px"></div>
    </div>`
  }).join('')}</div>`
}

async function showAnalytics(): Promise<void> {
  const root = getRoot()
  if (!root) return
  const range = (window as any).__mjRange || '30'
  const data = await api(`/api/admin/analytics?range=${range}`)
  ;(window as any).__mjRange = range
  const kpis = [
    { label: 'Appointments (all time)', value: data.totals.appointments },
    { label: `Appointments (${range === 'all' ? 'all' : range + 'd'})`, value: data.totals.appointmentsInRange },
    { label: 'Pending', value: data.kpis.pending },
    { label: 'Confirmed', value: data.kpis.confirmed },
    { label: 'Completed', value: data.kpis.completed },
    { label: 'Contact messages', value: data.kpis.unreadContacts },
    { label: 'Camp registrations', value: data.totals.campRegistrations },
    { label: 'Newsletter subscribers', value: data.kpis.subscribers },
  ]
  root.innerHTML = `
    ${pageHeader('Analytics', 'Request volume, status mix and department demand. Data is generated live from the practice store.', `<div class="flex items-center gap-2">
      <label class="text-sm text-gray-600 dark:text-slate-400">Range</label>
      <select id="analytics-range" class="admin-select">${['7', '30', '90', 'all'].map((r) => `<option value="${r}" ${r === range ? 'selected' : ''}>${r === 'all' ? 'All time' : r + ' days'}</option>`).join('')}</select>
    </div>`)}
    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">${kpis.map((k) => `<div class="card p-5"><p class="text-2xl font-bold" style="color: var(--color-heading)">${k.value}</p><p class="mt-1 text-sm text-gray-600 dark:text-slate-400">${esc(k.label)}</p></div>`).join('')}</div>
    <div class="mt-8 card p-6">
      <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Daily requests (appointments + contacts + camp registrations)</h2>
      ${barChart(data.series, [{ key: 'appointments', color: 'brand' }])}
      <p class="mt-2 text-xs text-gray-500 dark:text-slate-400">Peak day: ${esc((data.series.reduce((best: any, row: any) => (row.appointments > (best?.appointments || 0) ? row : best), null)?.date) || '—')}</p>
    </div>
    <div class="mt-8 grid gap-6 lg:grid-cols-2">
      <div class="card p-6">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Appointments by status</h2>
        ${data.byStatus.length === 0 ? '<p class="text-sm text-gray-500 dark:text-slate-400">No data.</p>' : data.byStatus.map(([k, v]: [string, number]) => `<div class="mb-2 flex items-center justify-between text-sm"><span>${esc(k)}</span><span class="font-semibold">${v}</span></div>`).join('')}
      </div>
      <div class="card p-6">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Top doctors / services</h2>
        ${data.byDoctor.length === 0 ? '<p class="text-sm text-gray-500 dark:text-slate-400">No data.</p>' : data.byDoctor.map(([k, v]: [string, number]) => `<div class="mb-2 flex items-center justify-between text-sm"><span class="truncate">${esc(k)}</span><span class="font-semibold">${v}</span></div>`).join('')}
      </div>
    </div>
  `
  document.getElementById('analytics-range')?.addEventListener('change', (e) => {
    ;(window as any).__mjRange = (e.target as HTMLSelectElement).value
    void showAnalytics()
  })
}

/* ------------------------------------------------------------------ */
/* Reports & MIS                                                       */
/* ------------------------------------------------------------------ */

interface ReportDef {
  key: string
  label: string
  columns: ReportColumn[]
  dateField?: string
}

const REPORTS: ReportDef[] = [
  { key: 'appointments', label: 'Appointment Register', dateField: 'createdAt', columns: [
    { key: 'id', label: 'ID' }, { key: 'patientName', label: 'Patient' }, { key: 'age', label: 'Age' }, { key: 'gender', label: 'Gender' },
    { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' }, { key: 'doctor', label: 'Doctor' }, { key: 'service', label: 'Department' },
    { key: 'date', label: 'Appointment Date' }, { key: 'time', label: 'Time' }, { key: 'mode', label: 'Mode' }, { key: 'firstVisit', label: 'First Visit' },
    { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Requested At' } ] },
  { key: 'campRegistrations', label: 'Camp Registration Register', dateField: 'createdAt', columns: [
    { key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }, { key: 'gender', label: 'Gender' },
    { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' }, { key: 'campTitle', label: 'Camp' }, { key: 'conditions', label: 'Conditions' }, { key: 'createdAt', label: 'Registered At' } ] },
  { key: 'contacts', label: 'Enquiry Register', dateField: 'createdAt', columns: [
    { key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' },
    { key: 'topic', label: 'Topic' }, { key: 'message', label: 'Message' }, { key: 'createdAt', label: 'Received At' } ] },
  { key: 'newsletter', label: 'Newsletter Subscribers', dateField: 'createdAt', columns: [
    { key: 'email', label: 'Email' }, { key: 'createdAt', label: 'Subscribed At' } ] },
  { key: 'doctors', label: 'Doctor Directory', columns: [
    { key: 'name', label: 'Name' }, { key: 'specialty', label: 'Specialty' }, { key: 'department', label: 'Department' },
    { key: 'qualification', label: 'Qualification' }, { key: 'registrationNumber', label: 'Reg. No.' }, { key: 'experience', label: 'Experience (yrs)' }, { key: 'opdFees', label: 'OPD Fee' } ] },
  { key: 'services', label: 'Services Directory', columns: [
    { key: 'title', label: 'Service' }, { key: 'slug', label: 'Slug' }, { key: 'short', label: 'Summary' } ] },
  { key: 'tpas', label: 'Insurance & TPA Directory', columns: [
    { key: 'name', label: 'Name' }, { key: 'type', label: 'Type' }, { key: 'helpline', label: 'Helpline' }, { key: 'email', label: 'Email' }, { key: 'cashless', label: 'Cashless' }, { key: 'active', label: 'Active' } ] },
]

function reportCell(value: unknown): string {
  if (Array.isArray(value)) return esc(value.join(', '))
  if (value === undefined || value === null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return esc(value)
}

function reportMIS(rows: any[], columns: ReportColumn[]): string {
  const statusKey = columns.some((c) => c.key === 'status') ? 'status' : null
  const cards: { label: string; value: number | string }[] = [{ label: 'Total records', value: rows.length }]
  if (statusKey) {
    const counts: Record<string, number> = {}
    rows.forEach((r) => { const k = String(r[statusKey] || '—'); counts[k] = (counts[k] || 0) + 1 })
    Object.entries(counts).forEach(([k, v]) => cards.push({ label: k, value: v }))
  }
  return `<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">${cards.map((c) => `<div class="card p-4"><p class="text-xl font-bold" style="color: var(--color-heading)">${c.value}</p><p class="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">${esc(c.label)}</p></div>`).join('')}</div>`
}

let reportKey = 'appointments'
let reportFrom = ''
let reportTo = ''

async function showReports(): Promise<void> {
  const root = getRoot()
  if (!root) return
  const def = REPORTS.find((r) => r.key === reportKey) || REPORTS[0]
  let rows: any[] = []
  let error = ''
  try {
    if (def.key === 'tpas') rows = (await api('/api/admin/tpas')).items
    else rows = (await api(`/api/admin/${def.key}`)).items
  } catch (err: any) {
    error = err.message
  }
  if (def.dateField && (reportFrom || reportTo)) {
    rows = rows.filter((r) => {
      const d = String(r[def.dateField as string] || '').slice(0, 10)
      if (!d) return false
      if (reportFrom && d < reportFrom) return false
      if (reportTo && d > reportTo) return false
      return true
    })
  }
  const table: ReportTable = { title: def.label, columns: def.columns, rows }

  root.innerHTML = `
    ${pageHeader('Reports & MIS', 'Generate operational registers and management information snapshots, then export in your preferred format.')}
    <div class="card mb-6 grid gap-4 p-6 md:grid-cols-4">
      <div><label class="mb-1 block text-sm font-medium">Report</label><select id="report-key" class="admin-input">${REPORTS.map((r) => `<option value="${esc(r.key)}" ${r.key === def.key ? 'selected' : ''}>${esc(r.label)}</option>`).join('')}</select></div>
      <div><label class="mb-1 block text-sm font-medium">From</label><input type="date" id="report-from" value="${esc(reportFrom)}" class="admin-input" /></div>
      <div><label class="mb-1 block text-sm font-medium">To</label><input type="date" id="report-to" value="${esc(reportTo)}" class="admin-input" /></div>
      <div class="flex items-end gap-2"><button type="button" id="report-generate" class="btn-primary">Generate</button><button type="button" id="report-reset" class="btn-secondary">Reset</button></div>
    </div>
    ${error ? `<div class="mb-6 rounded-sm bg-danger-500/10 px-4 py-3 text-sm text-danger-600">${esc(error)}</div>` : ''}
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <span class="text-sm font-semibold" style="color: var(--color-heading)">${esc(def.label)}</span>
      <span class="text-sm text-gray-500 dark:text-slate-400">${table.rows.length} record${table.rows.length === 1 ? '' : 's'}</span>
      <div class="ml-auto flex flex-wrap gap-2">
        <button type="button" id="export-csv" class="btn-secondary">CSV</button>
        <button type="button" id="export-xls" class="btn-secondary">Excel</button>
        <button type="button" id="export-doc" class="btn-secondary">Word</button>
        <button type="button" id="export-pdf" class="btn-secondary">PDF</button>
        <button type="button" id="export-json" class="btn-secondary">JSON</button>
      </div>
    </div>
    ${reportMIS(table.rows, def.columns)}
    <div class="overflow-x-auto rounded-md border dark:border-night-border">
      <table class="w-full min-w-[720px] text-left text-sm">
        <thead><tr class="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-night-border dark:bg-night-surface dark:text-slate-400">
          ${def.columns.map((c) => `<th class="px-4 py-3 font-semibold">${esc(c.label)}</th>`).join('')}
        </tr></thead>
        <tbody>${table.rows.length === 0 ? `<tr><td colspan="${def.columns.length}" class="px-4 py-12 text-center text-gray-500 dark:text-slate-400">No records match the selected filters.</td></tr>` : table.rows.slice(0, 100).map((r) => `<tr class="border-b last:border-0 dark:border-night-border">
          ${def.columns.map((c) => `<td class="px-4 py-3">${reportCell(r[c.key])}</td>`).join('')}
        </tr>`).join('')}</tbody>
      </table>
    </div>
    ${table.rows.length > 100 ? '<p class="mt-3 text-xs text-gray-500 dark:text-slate-400">Showing the first 100 rows. Exports include every matching record.</p>' : ''}
  `
  document.getElementById('report-generate')?.addEventListener('click', () => {
    reportKey = (document.getElementById('report-key') as HTMLSelectElement).value
    reportFrom = (document.getElementById('report-from') as HTMLInputElement).value
    reportTo = (document.getElementById('report-to') as HTMLInputElement).value
    void showReports()
  })
  document.getElementById('report-reset')?.addEventListener('click', () => {
    reportFrom = ''
    reportTo = ''
    void showReports()
  })
  const guard = (fn: (t: ReportTable) => void) => () => {
    if (table.rows.length === 0) { toast('There are no records to export.', 'error'); return }
    fn(table)
  }
  document.getElementById('export-csv')?.addEventListener('click', guard((t) => { exportCsv(t); toast('CSV downloaded.') }))
  document.getElementById('export-xls')?.addEventListener('click', guard((t) => { exportExcel(t); toast('Excel file downloaded.') }))
  document.getElementById('export-doc')?.addEventListener('click', guard((t) => { exportWord(t); toast('Word file downloaded.') }))
  document.getElementById('export-pdf')?.addEventListener('click', guard((t) => exportPdf(t, `${hospital.name} · MIS Report`)))
  document.getElementById('export-json')?.addEventListener('click', guard((t) => { exportJson(t); toast('JSON downloaded.') }))
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

async function renderCollection(name: string): Promise<void> {
  currentQuery = ''
  showCollection(name)
}

async function renderPage(name: string): Promise<void> {
  switch (name) {
    case 'settings':
      return showSettings()
    case 'site':
      return showSite()
    case 'media':
      return showMedia()
    case 'tpas':
      return showTpas()
    case 'payment':
      return showPayment()
    case 'activity':
      return showActivity()
    case 'analytics':
      return showAnalytics()
    case 'reports':
      return showReports()
    default:
      return showDashboard()
  }
}

async function render(): Promise<void> {
  const root = getRoot()
  if (!root) return
  if (!token()) {
    showLogin()
    return
  }
  const active = root.dataset.active || 'dashboard'
  try {
    if (getAdminConfig(active)) showCollection(active)
    else if (adminPages.some((p) => p.name === active)) await renderPage(active)
    else await showDashboard()
  } catch (err: any) {
    if (err?.message === 'unauthorized') return
    root.innerHTML = `<div class="card p-8 text-center"><p class="text-danger-600">${esc(err?.message || 'Something went wrong.')}</p><button id="retry-admin" class="btn-primary mt-4">Try Again</button></div>`
    document.getElementById('retry-admin')?.addEventListener('click', () => void render())
  }
}

export default function initAdmin(el: HTMLElement): void {
  setRoot(el)
  setUnauthorizedHandler(() => showLogin())
  void render()
}
