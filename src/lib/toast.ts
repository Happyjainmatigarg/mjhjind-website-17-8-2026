interface ToastOptions {
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

export function showToast(message: string, opts: ToastOptions = {}): void {
  const { type = 'success', duration = 5000 } = opts
  const container = document.getElementById('toast-container') as HTMLElement
  if (!container) return

  const toast = document.createElement('div')
  toast.className = 'toast ' + (type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : type === 'warning' ? 'bg-warm-500' : 'bg-brand-800')
  toast.setAttribute('role', 'status')

  const icon =
    type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : type === 'warning' ? 'lightning' : 'info'

  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        ${
          icon === 'check-circle'
            ? '<path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
            : icon === 'x-circle'
            ? '<path d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
            : icon === 'lightning'
            ? '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>'
            : '<circle cx="12" cy="12" r="8.25"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 11.25v4.5M12 8.25v.008"/>'
        }
      </svg>
      <span class="text-sm font-medium">${message}</span>
    </div>
  `

  container.appendChild(toast)
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)'
  })

  setTimeout(() => {
    toast.classList.add('toast-hidden')
    setTimeout(() => toast.remove(), 400)
  }, duration)
}
