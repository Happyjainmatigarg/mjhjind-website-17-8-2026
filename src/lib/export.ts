/*
  Dependency-free client-side export helpers for the admin reports/MIS screens.
  Produces CSV, Excel (.xls), Word (.doc), JSON and a print-based PDF.
*/

export interface ReportColumn {
  key: string
  label: string
}

export type ReportRow = Record<string, unknown>

export interface ReportTable {
  title: string
  columns: ReportColumn[]
  rows: ReportRow[]
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function escapeHtml(value: unknown): string {
  return cellText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function toCsv(columns: ReportColumn[], rows: ReportRow[]): string {
  const escape = (value: unknown): string => {
    const s = cellText(value)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = columns.map((c) => escape(c.label)).join(',')
  const body = rows.map((row) => columns.map((c) => escape(row[c.key])).join(',')).join('\r\n')
  return `\ufeff${header}\r\n${body}`
}

function tableHtml(table: ReportTable): string {
  return `<table border="1" cellspacing="0" cellpadding="6">
    <thead><tr>${table.columns.map((c) => `<th bgcolor="#2D5F8A"><font color="#FFFFFF">${escapeHtml(c.label)}</font></th>`).join('')}</tr></thead>
    <tbody>${table.rows
      .map((row) => `<tr>${table.columns.map((c) => `<td>${escapeHtml(row[c.key])}</td>`).join('')}</tr>`)
      .join('')}</tbody>
  </table>`
}

export function download(filename: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function safeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function exportCsv(table: ReportTable): void {
  download(`${safeName(table.title)}-${stamp()}.csv`, 'text/csv;charset=utf-8', toCsv(table.columns, table.rows))
}

export function exportExcel(table: ReportTable): void {
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${escapeHtml(table.title)}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>${tableHtml(table)}</body></html>`
  download(`${safeName(table.title)}-${stamp()}.xls`, 'application/vnd.ms-excel', html)
}

export function exportWord(table: ReportTable): void {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8" /><title>${escapeHtml(table.title)}</title></head><body><h2>${escapeHtml(table.title)}</h2>${tableHtml(table)}</body></html>`
  download(`${safeName(table.title)}-${stamp()}.doc`, 'application/msword', html)
}

export function exportJson(table: ReportTable): void {
  download(`${safeName(table.title)}-${stamp()}.json`, 'application/json', JSON.stringify(table.rows, null, 2))
}

export function exportPdf(table: ReportTable, subtitle = ''): void {
  const win = window.open('', '_blank', 'width=1024,height=768')
  if (!win) {
    window.alert('Allow pop-ups to export the PDF, or use your browser print dialog.')
    return
  }
  const generated = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(table.title)}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #2D3436; margin: 28px; }
      h1 { font-size: 20px; margin: 0 0 4px; color: #2D5F8A; }
      p.meta { margin: 0 0 18px; font-size: 12px; color: #6b7280; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #2D5F8A; color: #fff; text-align: left; padding: 8px; }
      td { border-bottom: 1px solid #e5e7eb; padding: 7px 8px; vertical-align: top; }
      tr:nth-child(even) td { background: #f7f5f2; }
      @media print { @page { margin: 14mm; } }
    </style></head><body>
    <h1>${escapeHtml(table.title)}</h1>
    <p class="meta">${escapeHtml(subtitle || '')}${subtitle ? ' · ' : ''}Generated ${escapeHtml(generated)}</p>
    ${tableHtml(table)}
    <script>window.focus(); window.print(); window.onafterprint = function () { window.close(); };<\/script>
    </body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  win.location.href = url
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
