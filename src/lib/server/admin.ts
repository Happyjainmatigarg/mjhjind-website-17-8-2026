import crypto from 'node:crypto'
import { getDefaultStorage, type Storage } from './storage'

const storage: Storage = getDefaultStorage()

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface AdminConfig {
  username: string
  passwordHash: string
  salt: string
}

interface Session {
  token: string
  username: string
  createdAt: number
}

async function ensureAdmin(): Promise<AdminConfig> {
  const cfg = await storage.readAdmin()
  if (cfg && cfg.username && cfg.passwordHash && cfg.salt) return cfg
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'mjadmin2024'
  const salt = crypto.randomBytes(16).toString('hex')
  const passwordHash = hashPassword(password, salt)
  const config: AdminConfig = { username, passwordHash, salt }
  await storage.writeAdmin(config)
  if (!process.env.ADMIN_PASSWORD) {
    try {
      // eslint-disable-next-line no-console
      console.warn('[admin] No ADMIN_PASSWORD set — using default credentials. Set ADMIN_USERNAME / ADMIN_PASSWORD to change.')
    } catch {
      // ignore
    }
  }
  return config
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex')
}

async function readSessions(): Promise<Session[]> {
  return await storage.readSessions()
}

async function writeSessions(sessions: Session[]): Promise<void> {
  await storage.writeSessions(sessions)
}

function pruneExpired(sessions: Session[]): Session[] {
  const now = Date.now()
  return sessions.filter((s) => now - s.createdAt < SESSION_TTL_MS)
}

export async function verifyLogin(username: string, password: string): Promise<{ token: string; username: string } | null> {
  const config = await ensureAdmin()
  const user = String(username || '').trim()
  const pass = String(password || '')
  if (user !== config.username) return null
  const hash = hashPassword(pass, config.salt)
  const expected = Buffer.from(config.passwordHash, 'hex')
  const actual = Buffer.from(hash, 'hex')
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null
  const token = crypto.randomBytes(24).toString('hex')
  const sessions = pruneExpired(await readSessions())
  sessions.push({ token, username: user, createdAt: Date.now() })
  await writeSessions(sessions)
  return { token, username: user }
}

export async function requireAdmin(request: Request): Promise<string | null> {
  const header = request.headers.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) return null
  const token = match[1].trim()
  const sessions = pruneExpired(await readSessions())
  const session = sessions.find((s) => s.token === token)
  if (!session) return null
  await writeSessions(sessions)
  return session.username
}
