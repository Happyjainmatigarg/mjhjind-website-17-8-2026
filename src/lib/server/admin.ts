import { hmacSha256Hex, timingSafeEqualString, toBase64Url, fromBase64Url } from '../crypto'

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const DEFAULT_USERNAME = 'admin'
const DEFAULT_PASSWORD = 'mjadmin2024'

function readEnv(name: string): string | undefined {
  try {
    if (typeof process !== 'undefined' && process.env) {
      const value = process.env[name]
      if (typeof value === 'string' && value.length > 0) return value
    }
  } catch {
    // Cloudflare Workers may not expose process.env
  }
  return undefined
}

function adminUsername(): string {
  return readEnv('ADMIN_USERNAME') || DEFAULT_USERNAME
}

function adminPassword(): string {
  return readEnv('ADMIN_PASSWORD') || DEFAULT_PASSWORD
}

function sessionSecret(): string {
  return readEnv('ADMIN_SESSION_SECRET') || `${adminPassword()}:mjh-admin-session`
}

async function signSession(username: string): Promise<string> {
  const body = toBase64Url(JSON.stringify({ u: username, exp: Date.now() + SESSION_TTL_MS }))
  const sig = await hmacSha256Hex(sessionSecret(), body)
  return `${body}.${sig}`
}

async function verifySession(token: string): Promise<string | null> {
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!body || !sig) return null
  const expected = await hmacSha256Hex(sessionSecret(), body)
  if (!timingSafeEqualString(sig, expected)) return null
  try {
    const payload = JSON.parse(fromBase64Url(body)) as { u?: string; exp?: number }
    if (!payload.u || typeof payload.exp !== 'number') return null
    if (Date.now() > payload.exp) return null
    if (payload.u !== adminUsername()) return null
    return payload.u
  } catch {
    return null
  }
}

export async function verifyLogin(username: string, password: string): Promise<{ token: string; username: string } | null> {
  const user = String(username || '').trim()
  const pass = String(password || '')
  const expectedUser = adminUsername()
  const expectedPass = adminPassword()
  const userOk = user.length === expectedUser.length && timingSafeEqualString(user, expectedUser)
  const passOk = pass.length === expectedPass.length && timingSafeEqualString(pass, expectedPass)
  if (!userOk || !passOk) return null
  const token = await signSession(user)
  return { token, username: user }
}

export async function requireAdmin(request: Request): Promise<string | null> {
  const header = request.headers.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) return null
  return verifySession(match[1].trim())
}
