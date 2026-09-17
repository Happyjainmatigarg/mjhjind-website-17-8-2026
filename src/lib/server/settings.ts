import { decryptSecret, encryptSecret } from './crypto-box'
import {
  DEFAULT_EMAIL_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  getPaymentSettings,
  getSettings,
  savePaymentSettings as persistPaymentSettings,
  saveSettings,
  saveSiteSettings,
  type EmailSettingsRecord,
  type MailMode,
  type MailProvider,
  type PaymentProvider,
  type PaymentSettingsRecord,
  type SiteSettingsRecord,
  type SocialLinkRecord,
} from './store'

export interface ResolvedEmailConfig {
  transport: 'api' | 'smtp' | 'none'
  provider: MailProvider
  apiKey: string
  smtp: { host: string; port: number; secure: boolean; user: string; pass: string }
  fromName: string
  fromEmail: string
  adminNotifyEmails: string[]
}

export interface PublicEmailSettings {
  mode: MailMode
  provider: MailProvider
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string
  fromName: string
  fromEmail: string
  adminNotifyEmails: string
  apiKeySet: boolean
  smtpPassSet: boolean
  configured: boolean
  transport: 'api' | 'smtp' | 'none'
  updatedAt: string
}

function readEnv(name: string): string {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[name]) return String(process.env[name])
  } catch {
    // Workers may not expose process.env
  }
  return ''
}

/** Full config including secrets — server-side use only. */
export async function getEmailConfig(): Promise<ResolvedEmailConfig> {
  const stored = getSettings().email
  const apiKey = (await decryptSecret(stored.apiKey)) || readEnv('MAIL_API_KEY')
  const smtpPass = (await decryptSecret(stored.smtpPass)) || readEnv('SMTP_PASS')

  const smtp = {
    host: stored.smtpHost || readEnv('SMTP_HOST') || 'smtp.gmail.com',
    port: Number(stored.smtpPort) || Number(readEnv('SMTP_PORT')) || 587,
    secure: stored.smtpSecure || readEnv('SMTP_SECURE').toLowerCase() === 'true',
    user: stored.smtpUser || readEnv('SMTP_USER'),
    pass: smtpPass,
  }

  let transport: ResolvedEmailConfig['transport'] = 'none'
  if (stored.mode === 'api') transport = apiKey ? 'api' : 'none'
  else if (stored.mode === 'smtp') transport = smtp.user && smtp.pass ? 'smtp' : 'none'
  else if (apiKey) transport = 'api'
  else if (smtp.user && smtp.pass) transport = 'smtp'

  return {
    transport,
    provider: stored.provider || 'resend',
    apiKey,
    smtp,
    fromName: stored.fromName || DEFAULT_EMAIL_SETTINGS.fromName,
    fromEmail: stored.fromEmail || readEnv('MAIL_FROM') || DEFAULT_EMAIL_SETTINGS.fromEmail,
    adminNotifyEmails: (stored.adminNotifyEmails || readEnv('ADMIN_NOTIFY_EMAILS') || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean),
  }
}

/** Safe (masked) config for the admin UI. Secrets are never returned. */
export async function getPublicEmailSettings(): Promise<PublicEmailSettings> {
  const stored = getSettings().email
  const config = await getEmailConfig()
  return {
    mode: stored.mode,
    provider: stored.provider,
    smtpHost: stored.smtpHost,
    smtpPort: stored.smtpPort,
    smtpSecure: stored.smtpSecure,
    smtpUser: stored.smtpUser,
    fromName: stored.fromName,
    fromEmail: stored.fromEmail,
    adminNotifyEmails: stored.adminNotifyEmails,
    apiKeySet: Boolean(await decryptSecret(stored.apiKey)),
    smtpPassSet: Boolean(await decryptSecret(stored.smtpPass)),
    configured: config.transport !== 'none',
    transport: config.transport,
    updatedAt: stored.updatedAt,
  }
}

export interface EmailSettingsPatch {
  mode?: MailMode
  provider?: MailProvider
  apiKey?: string
  clearApiKey?: boolean
  smtpHost?: string
  smtpPort?: number | string
  smtpSecure?: boolean
  smtpUser?: string
  smtpPass?: string
  clearSmtpPass?: boolean
  fromName?: string
  fromEmail?: string
  adminNotifyEmails?: string
}

/** Persist settings, encrypting secrets. Empty secret strings leave the stored value unchanged. */
export async function saveEmailSettings(patch: EmailSettingsPatch): Promise<PublicEmailSettings> {
  const next: Partial<EmailSettingsRecord> = {}
  if (patch.mode) next.mode = patch.mode
  if (patch.provider) next.provider = patch.provider
  if (typeof patch.smtpHost === 'string') next.smtpHost = patch.smtpHost.trim()
  if (patch.smtpPort !== undefined) next.smtpPort = Number(patch.smtpPort) || 587
  if (typeof patch.smtpSecure === 'boolean') next.smtpSecure = patch.smtpSecure
  if (typeof patch.smtpUser === 'string') next.smtpUser = patch.smtpUser.trim()
  if (typeof patch.fromName === 'string') next.fromName = patch.fromName.trim()
  if (typeof patch.fromEmail === 'string') next.fromEmail = patch.fromEmail.trim()
  if (typeof patch.adminNotifyEmails === 'string') next.adminNotifyEmails = patch.adminNotifyEmails.replace(/\s+/g, '')

  if (patch.clearApiKey) next.apiKey = ''
  else if (patch.apiKey) next.apiKey = await encryptSecret(patch.apiKey.trim())

  if (patch.clearSmtpPass) next.smtpPass = ''
  else if (patch.smtpPass) next.smtpPass = await encryptSecret(patch.smtpPass)

  saveSettings(next)
  return getPublicEmailSettings()
}

export interface SiteSettingsPatch {
  email?: string
  phones?: Partial<SiteSettingsRecord['phones']>
  address?: Partial<SiteSettingsRecord['address']>
  hours?: Partial<SiteSettingsRecord['hours']>
  social?: Partial<SocialLinkRecord>[]
}

export function updateSiteSettings(patch: SiteSettingsPatch): SiteSettingsRecord {
  return saveSiteSettings(patch as Partial<SiteSettingsRecord>)
}

export interface PublicPaymentSettings {
  enabled: boolean
  provider: PaymentProvider
  mode: 'test' | 'live'
  keyId: string
  upiId: string
  instructions: string
  keySecretSet: boolean
  updatedAt: string
}

export async function getPublicPaymentSettings(): Promise<PublicPaymentSettings> {
  const stored = getPaymentSettings()
  return {
    enabled: stored.enabled,
    provider: stored.provider,
    mode: stored.mode,
    keyId: stored.keyId,
    upiId: stored.upiId,
    instructions: stored.instructions,
    keySecretSet: Boolean(await decryptSecret(stored.keySecret)),
    updatedAt: stored.updatedAt,
  }
}

export interface PaymentSettingsPatch {
  enabled?: boolean
  provider?: PaymentProvider
  mode?: 'test' | 'live'
  keyId?: string
  keySecret?: string
  clearKeySecret?: boolean
  upiId?: string
  instructions?: string
}

export async function updatePaymentSettings(patch: PaymentSettingsPatch): Promise<PublicPaymentSettings> {
  const current = getPaymentSettings()
  const next: PaymentSettingsRecord = {
    ...DEFAULT_PAYMENT_SETTINGS,
    ...current,
    enabled: patch.enabled !== undefined ? Boolean(patch.enabled) : current.enabled,
    provider: patch.provider ?? current.provider,
    mode: patch.mode ?? current.mode,
    keyId: patch.keyId !== undefined ? String(patch.keyId).trim() : current.keyId,
    upiId: patch.upiId !== undefined ? String(patch.upiId).trim() : current.upiId,
    instructions: patch.instructions !== undefined ? String(patch.instructions) : current.instructions,
    updatedAt: new Date().toISOString(),
  }
  if (patch.clearKeySecret) next.keySecret = ''
  else if (patch.keySecret) next.keySecret = await encryptSecret(patch.keySecret)

  persistPaymentSettings(next)
  return getPublicPaymentSettings()
}
