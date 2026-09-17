/*
  Symmetric encryption for admin-stored secrets (SMTP passwords, API keys).

  Uses Web Crypto AES-GCM so it runs identically on Node and Cloudflare Workers.
  The 256-bit key is derived with SHA-256 from (in order):
    ADMIN_SETTINGS_SECRET -> ADMIN_SESSION_SECRET -> admin password + fixed salt.

  Ciphertext format: "<iv-b64url>.<cipher-b64url>". If a value was encrypted
  with a different secret it simply fails to decrypt and is treated as absent.
*/

const ENC_PREFIX = 'enc:v1:'

function getCrypto(): Crypto {
  const c = globalThis.crypto
  if (!c?.subtle) throw new Error('Web Crypto is not available')
  return c
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4))
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/') + pad
  const bin = atob(b64)
  const bytes = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function readEnv(name: string): string | undefined {
  try {
    if (typeof process !== 'undefined' && process.env) {
      const value = process.env[name]
      if (typeof value === 'string' && value.length > 0) return value
    }
  } catch {
    // Workers may not expose process.env
  }
  return undefined
}

function secretSeed(): string {
  return (
    readEnv('ADMIN_SETTINGS_SECRET') ||
    readEnv('ADMIN_SESSION_SECRET') ||
    `${readEnv('ADMIN_PASSWORD') || 'mjadmin2024'}:mjh-settings-box`
  )
}

let cachedKey: CryptoKey | null = null
let cachedSeed = ''

async function deriveKey(): Promise<CryptoKey> {
  const seed = secretSeed()
  if (cachedKey && cachedSeed === seed) return cachedKey
  const digest = await getCrypto().subtle.digest('SHA-256', new TextEncoder().encode(seed))
  cachedKey = await getCrypto().subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
  cachedSeed = seed
  return cachedKey
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function isEncrypted(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX)
}

export async function encryptSecret(plain: string): Promise<string> {
  if (!plain) return ''
  const key = await deriveKey()
  const iv = getCrypto().getRandomValues(new Uint8Array(new ArrayBuffer(12)))
  const cipher = await getCrypto().subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plain))
  return `${ENC_PREFIX}${toBase64Url(iv)}.${toBase64Url(new Uint8Array(cipher))}`
}

export async function decryptSecret(value: unknown): Promise<string> {
  if (typeof value !== 'string' || !value) return ''
  if (!isEncrypted(value)) return value
  try {
    const payload = value.slice(ENC_PREFIX.length)
    const dot = payload.indexOf('.')
    if (dot <= 0) return ''
    const iv = fromBase64Url(payload.slice(0, dot))
    const data = fromBase64Url(payload.slice(dot + 1))
    const key = await deriveKey()
    const plain = await getCrypto().subtle.decrypt({ name: 'AES-GCM', iv } as AesGcmParams, key, data as BufferSource)
    return decoder.decode(plain)
  } catch {
    return ''
  }
}
