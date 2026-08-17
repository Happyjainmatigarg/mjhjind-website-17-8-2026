// Cross-platform crypto helpers for Node and Cloudflare Workers.
// Exports: randomHex(bytes), hashPassword(password, salt), timingSafeEqualHex(a, b)

function isNode(): boolean {
  try {
    return typeof process !== 'undefined' && !!(process.versions && process.versions.node)
  } catch {
    return false
  }
}

function toHex(buffer: Uint8Array): string {
  return Array.from(buffer).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array {
  if (!hex) return new Uint8Array()
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

export async function randomHex(bytes: number): Promise<string> {
  if (isNode()) {
    // Node implementation
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = await import('node:crypto')
    return crypto.randomBytes(bytes).toString('hex')
  }
  // Workers / browser
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return toHex(arr)
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  if (isNode()) {
    const crypto = await import('node:crypto')
    return crypto.scryptSync(password, salt, 64).toString('hex')
  }
  // Use PBKDF2 on Workers / browser as a secure fallback
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits'])
  const saltBytes = enc.encode(salt)
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 64 * 8)
  return toHex(new Uint8Array(derived))
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  const x = fromHex(a)
  const y = fromHex(b)
  if (x.length !== y.length) return false
  // constant-time comparison
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}
