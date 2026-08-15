export interface Storage {
  readAdmin(): Promise<{ username: string; passwordHash: string; salt: string } | null>
  writeAdmin(cfg: { username: string; passwordHash: string; salt: string }): Promise<void>
  readSessions(): Promise<Array<{ token: string; username: string; createdAt: number }>>
  writeSessions(sessions: Array<{ token: string; username: string; createdAt: number }>): Promise<void>
  // raw key/value helpers for bootstrap data (used by Workers KV and Node fs fallback)
  getRaw(key: string): Promise<string | null>
  setRaw(key: string, value: string): Promise<void>
  deleteRaw(key: string): Promise<void>
}

// Node fs-backed implementation (lazy imports to avoid bundling issues on Workers)
export const nodeFsStorage: Storage = {
  async readAdmin() {
    try {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const dataDir = path.resolve(process.cwd(), 'data')
      const adminFile = path.join(dataDir, 'admin.json')
      if (!fs.existsSync(adminFile)) return null
      const text = fs.readFileSync(adminFile, 'utf-8')
      return JSON.parse(text)
    } catch {
      return null
    }
  },
  async writeAdmin(cfg) {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const dataDir = path.resolve(process.cwd(), 'data')
    const adminFile = path.join(dataDir, 'admin.json')
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
    fs.writeFileSync(adminFile, JSON.stringify(cfg, null, 2))
  },
  async readSessions() {
    try {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const dataDir = path.resolve(process.cwd(), 'data')
      const sessionsFile = path.join(dataDir, 'admin-sessions.json')
      if (!fs.existsSync(sessionsFile)) return []
      const parsed = JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'))
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },
  async writeSessions(sessions) {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const dataDir = path.resolve(process.cwd(), 'data')
    const sessionsFile = path.join(dataDir, 'admin-sessions.json')
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2))
  },
  async getRaw(key) {
    try {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const dataDir = path.resolve(process.cwd(), 'data')
      const file = path.join(dataDir, `kv-${key}`)
      if (!fs.existsSync(file)) return null
      return fs.readFileSync(file, 'utf-8')
    } catch {
      return null
    }
  },
  async setRaw(key, value) {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const dataDir = path.resolve(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
    const file = path.join(dataDir, `kv-${key}`)
    fs.writeFileSync(file, value)
  },
  async deleteRaw(key) {
    try {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const dataDir = path.resolve(process.cwd(), 'data')
      const file = path.join(dataDir, `kv-${key}`)
      if (fs.existsSync(file)) fs.unlinkSync(file)
    } catch {
      // ignore
    }
  },
}

// Worker KV implementation (expects a KV namespace bound to globalThis.ADMIN_KV or passed directly)
export function workerKVStorage(kv: any): Storage {
  return {
    async readAdmin() {
      try {
        if (!kv) return null
        const raw = await kv.get('admin')
        if (!raw) return null
        if (typeof raw === 'string') return JSON.parse(raw)
        return raw
      } catch {
        return null
      }
    },
    async writeAdmin(cfg) {
      if (!kv) throw new Error('KV not available')
      await kv.put('admin', JSON.stringify(cfg))
    },
    async readSessions() {
      try {
        if (!kv) return []
        const raw = await kv.get('sessions')
        if (!raw) return []
        if (typeof raw === 'string') {
          const parsed = JSON.parse(raw)
          return Array.isArray(parsed) ? parsed : []
        }
        return Array.isArray(raw) ? raw : []
      } catch {
        return []
      }
    },
    async writeSessions(sessions) {
      if (!kv) throw new Error('KV not available')
      await kv.put('sessions', JSON.stringify(sessions))
    },
    async getRaw(key) {
      if (!kv) return null
      const v = await kv.get(key)
      if (!v) return null
      return typeof v === 'string' ? v : JSON.stringify(v)
    },
    async setRaw(key, value) {
      if (!kv) throw new Error('KV not available')
      await kv.put(key, value)
    },
    async deleteRaw(key) {
      if (!kv) return
      await kv.delete(key)
    },
  }
}

// Choose default storage: if a KV binding is present on globalThis.ADMIN_KV, use it; otherwise use nodeFsStorage
export function getDefaultStorage(): Storage {
  // In Cloudflare Workers, bindings are available on the global scope. Some bundlers expose them as globalThis.
  const maybeKV = (globalThis as any).ADMIN_KV
  if (maybeKV) return workerKVStorage(maybeKV)
  return nodeFsStorage
}
