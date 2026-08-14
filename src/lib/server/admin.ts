import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const dataDir = path.resolve(process.cwd(), 'data')
const adminFile = path.join(dataDir, 'admin.json')
const sessionsFile = path.join(dataDir, 'admin-sessions.json')

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

function ensureAdmin(): AdminConfig {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(adminFile)) {
    const username = process.env.ADMIN_USERNAME || 'admin'
    const password = process.env.ADMIN_PASSWORD || 'mjadmin2024'
    const salt = crypto.randomBytes(16).toString('hex')
    const passwordHash = hashPassword(password, salt)
    const config: AdminConfig = { username, passwordHash, salt }
    fs.writeFileSync(adminFile, JSON.stringify(config, null, 2))
    if (!process.env.ADMIN_PASSWORD) {
      console.warn('[admin] No ADMIN_PASSWORD set — using default credentials. Set ADMIN_USERNAME / ADMIN_PASSWORD to change.')
    }
    return config
  }
  try {
    const config = JSON.parse(fs.readFileSync(adminFile, 'utf-8')) as AdminConfig
    if (config.username && config.passwordHash && config.salt) return config
  } catch {
    /* fallthrough */
  }
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'mjadmin2024'
  const salt = crypto.randomBytes(16).toString('hex')
  const config: AdminConfig = { username, passwordHash: hashPassword(password, salt), salt }
  fs.writeFileSync(adminFile, JSON.stringify(config, null, 2))
  return config
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex')
}

function readSessions(): Session[] {
  if (!fs.existsSync(sessionsFile)) return []
  try {
    const parsed = JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeSessions(sessions: Session[]): void {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2))
}

function pruneExpired(sessions: Session[]): Session[] {
  const now = Date.now()
  return sessions.filter((s) => now - s.createdAt < SESSION_TTL_MS)
}

export function verifyLogin(username: string, password: string): { token: string; username: string } | null {
  const config = ensureAdmin()
  const user = String(username || '').trim()
  const pass = String(password || '')
  if (user !== config.username) return null
  const hash = hashPassword(pass, config.salt)
  const expected = Buffer.from(config.passwordHash, 'hex')
  const actual = Buffer.from(hash, 'hex')
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null
  const token = crypto.randomBytes(24).toString('hex')
  const sessions = pruneExpired(readSessions())
  sessions.push({ token, username: user, createdAt: Date.now() })
  writeSessions(sessions)
  return { token, username: user }
}

export function requireAdmin(request: Request): string | null {
  const header = request.headers.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) return null
  const token = match[1].trim()
  const sessions = pruneExpired(readSessions())
  const session = sessions.find((s) => s.token === token)
  if (!session) return null
  writeSessions(sessions)
  return session.username
}
