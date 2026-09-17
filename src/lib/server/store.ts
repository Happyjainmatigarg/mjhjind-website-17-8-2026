/*
  Storage adapter for server-side data.
  - In Node (local dev) this uses the filesystem (data/store.json).
  - In Cloudflare Workers (or other serverless runtimes without Node built-ins)
    it falls back to an in-memory store (non-persistent) to avoid runtime errors.

  This prevents the worker from throwing 500s when node:fs or node:path are not available.
*/

import { slugify } from '../utils'
import type { Doctor } from '../../data/doctors'
import { doctors } from '../../data/doctors'
import type { BlogPost } from '../../data/blog'
import { blogPosts } from '../../data/blog'
import type { HealthCamp } from '../../data/camps'
import { camps } from '../../data/camps'
import type { Service } from '../../data/services'
import { services } from '../../data/services'
import type { Faq } from '../../data/faqs'
import { faqs } from '../../data/faqs'
import type { GalleryItem } from '../../data/gallery'
import { gallery } from '../../data/gallery'
import type { Testimonial } from '../../data/testimonials'
import { testimonials } from '../../data/testimonials'
import { hospital } from '../../data/site'

// Try to obtain Node built-ins at runtime only if available.
let canUseFs = false as boolean
let nodeFs: typeof import('fs') | undefined
let nodePath: typeof import('path') | undefined
try {
  // Use a dynamic require trick to avoid static ESM imports so bundlers targeting Workers
  // won't automatically externalize node built-ins and cause runtime failures.
  // This will succeed in Node.js (local dev) and fail silently in Workers.
  // eslint-disable-next-line no-new-func
  const _req: any = Function('return require')()
  nodeFs = _req('fs')
  nodePath = _req('path')
  canUseFs = !!nodeFs && !!nodePath
} catch (e) {
  canUseFs = false
}

export interface AppointmentRecord {
  id: string
  doctor: string
  service: string
  date: string
  time: string
  patientName: string
  phone: string
  email: string
  age: number
  gender: string
  symptoms: string
  firstVisit: string
  mode: string
  createdAt: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

export interface CampRegistrationRecord {
  id: string
  campSlug: string
  campTitle: string
  name: string
  age: number
  phone: string
  email: string
  gender: string
  conditions: string[]
  notes: string
  createdAt: string
}

export interface ContactRecord {
  id: string
  name: string
  phone: string
  email: string
  topic: string
  message: string
  createdAt: string
}

export interface NewsletterRecord {
  id: string
  email: string
  createdAt: string
}

export type ContentCollection =
  | 'doctors'
  | 'blogPosts'
  | 'camps'
  | 'services'
  | 'faqs'
  | 'gallery'
  | 'testimonials'

export type FormCollection = 'appointments' | 'campRegistrations' | 'contacts' | 'newsletter'

export type StoreCollection = ContentCollection | FormCollection

export type MailMode = 'auto' | 'smtp' | 'api'
export type MailProvider = 'resend' | 'sendgrid' | 'brevo'

export interface EmailSettingsRecord {
  mode: MailMode
  provider: MailProvider
  apiKey: string
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string
  smtpPass: string
  fromName: string
  fromEmail: string
  adminNotifyEmails: string
  updatedAt: string
}

export type SocialKey = 'facebook' | 'instagram' | 'linkedin' | 'whatsapp' | 'x' | 'youtube'

export interface SocialLinkRecord {
  key: SocialKey
  label: string
  url: string
  icon: string
  enabled: boolean
}

export type PaymentProvider = 'offline' | 'razorpay' | 'payu' | 'phonepe' | 'cashfree' | 'stripe'

export interface PaymentSettingsRecord {
  enabled: boolean
  provider: PaymentProvider
  mode: 'test' | 'live'
  keyId: string
  keySecret: string
  upiId: string
  instructions: string
  updatedAt: string
}

export interface SiteSettingsRecord {
  email: string
  phones: { emergency: string; ambulance: string; appointment: string; reception: string }
  address: { line1: string; line2: string; city: string; state: string; pincode: string }
  hours: { opd: string; emergency: string; visiting: string; pharmacy: string }
  social: SocialLinkRecord[]
  updatedAt: string
}

export interface AppSettingsShape {
  email: EmailSettingsRecord
  site: SiteSettingsRecord
  payment: PaymentSettingsRecord
}

export interface TpaRepository {
  id: string
  name: string
  type: 'insurer' | 'tpa'
  logo: string
  helpline: string
  email: string
  cashless: boolean
  notes: string
  active: boolean
  createdAt?: string
}

export interface MediaRecord {
  id: string
  filename: string
  mime: string
  size: number
  data: string
  alt: string
  folder: string
  visible: boolean
  uploadedAt: string
}

export interface ActivityRecord {
  id: string
  at: string
  user: string
  action: string
  collection: string
  itemId: string
  summary: string
}

export const CONTENT_COLLECTIONS: ContentCollection[] = [
  'doctors',
  'blogPosts',
  'camps',
  'services',
  'faqs',
  'gallery',
  'testimonials',
]

export const ADMIN_COLLECTIONS: StoreCollection[] = [
  'appointments',
  'campRegistrations',
  'contacts',
  'newsletter',
  'doctors',
  'blogPosts',
  'camps',
  'services',
  'faqs',
  'gallery',
  'testimonials',
]

interface StoreShape {
  _contentSeeded?: boolean
  doctors: Doctor[]
  blogPosts: BlogPost[]
  camps: HealthCamp[]
  services: Service[]
  faqs: (Faq & { id: string })[]
  gallery: (GalleryItem & { id: string })[]
  testimonials: (Testimonial & { id: string })[]
  appointments: AppointmentRecord[]
  campRegistrations: CampRegistrationRecord[]
  contacts: ContactRecord[]
  newsletter: NewsletterRecord[]
  settings: AppSettingsShape
  activity: ActivityRecord[]
  tpas: TpaRepository[]
  media: MediaRecord[]
}

export const DEFAULT_EMAIL_SETTINGS: EmailSettingsRecord = {
  mode: 'auto',
  provider: 'resend',
  apiKey: '',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPass: '',
  fromName: 'Meenakshi Jain Hospital',
  fromEmail: 'mjhospital2003@gmail.com',
  adminNotifyEmails: 'mjhospital2003@gmail.com',
  updatedAt: '',
}

export const DEFAULT_SOCIAL: SocialLinkRecord[] = [
  { key: 'facebook', label: 'Facebook', url: hospital.social.facebook || '', icon: 'facebook', enabled: Boolean(hospital.social.facebook) },
  { key: 'instagram', label: 'Instagram', url: hospital.social.instagram || '', icon: 'instagram', enabled: Boolean(hospital.social.instagram) },
  { key: 'linkedin', label: 'LinkedIn', url: '', icon: 'linkedin', enabled: false },
  { key: 'whatsapp', label: 'WhatsApp', url: hospital.social.whatsapp || '', icon: 'whatsapp', enabled: Boolean(hospital.social.whatsapp) },
  { key: 'x', label: 'X (Twitter)', url: '', icon: 'x', enabled: false },
]

export const DEFAULT_SITE_SETTINGS: SiteSettingsRecord = {
  email: hospital.email,
  phones: { ...hospital.phones },
  address: { ...hospital.address },
  hours: {
    opd: hospital.hours.opd,
    emergency: 'Open 24 × 7',
    visiting: '11:00 AM – 12:30 PM, 5:00 PM – 7:00 PM',
    pharmacy: 'Open 24 × 7',
  },
  social: DEFAULT_SOCIAL.map((s) => ({ ...s })),
  updatedAt: '',
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettingsRecord = {
  enabled: false,
  provider: 'offline',
  mode: 'test',
  keyId: '',
  keySecret: '',
  upiId: '',
  instructions: 'Pay at the hospital reception by cash, UPI or card. Online payment is optional at booking.',
  updatedAt: '',
}

function defaultSettings(): AppSettingsShape {
  return {
    email: { ...DEFAULT_EMAIL_SETTINGS },
    site: { ...DEFAULT_SITE_SETTINGS, phones: { ...DEFAULT_SITE_SETTINGS.phones }, address: { ...DEFAULT_SITE_SETTINGS.address }, hours: { ...DEFAULT_SITE_SETTINGS.hours }, social: DEFAULT_SOCIAL.map((s) => ({ ...s })) },
    payment: { ...DEFAULT_PAYMENT_SETTINGS },
  }
}

// When fs is available, use real file paths. Otherwise, fall back to in-memory store.
let dataDir = ''
let storeFile = ''
if (canUseFs && nodePath) {
  dataDir = nodePath.resolve(process.cwd(), 'data')
  storeFile = nodePath.join(dataDir, 'store.json')
}

function mergeSocial(stored: unknown): SocialLinkRecord[] {
  const list = Array.isArray(stored) ? (stored as Partial<SocialLinkRecord>[]) : []
  return DEFAULT_SOCIAL.map((base) => {
    const found = list.find((s) => s?.key === base.key)
    return found ? { ...base, ...found, key: base.key, label: base.label, icon: base.icon } : { ...base }
  })
}

function seedContent(): Omit<
  StoreShape,
  'appointments' | 'campRegistrations' | 'contacts' | 'newsletter' | 'settings' | 'activity' | 'tpas' | 'media'
> {
  return {
    doctors: doctors.map((d) => ({ ...d })),
    blogPosts: blogPosts.map((p) => ({ ...p })),
    camps: camps.map((c) => ({ ...c })),
    services: services.map((s) => ({ ...s })),
    faqs: faqs.map((f, i) => ({ ...f, id: 'faq-' + (i + 1) })),
    gallery: gallery.map((g, i) => ({ ...g, id: 'gallery-' + (i + 1) })),
    testimonials: testimonials.map((t, i) => ({ ...t, id: 'testimonial-' + (i + 1) })),
  }
}

function emptyStore(): StoreShape {
  return {
    _contentSeeded: true,
    ...seedContent(),
    appointments: [],
    campRegistrations: [],
    contacts: [],
    newsletter: [],
    settings: defaultSettings(),
    activity: [],
    tpas: [],
    media: [],
  }
}

// In-memory fallback for runtimes without fs (non-persistent)
let MEMORY_STORE: StoreShape | null = null

function ensureStore(): void {
  if (canUseFs && nodeFs && nodePath) {
    if (!nodeFs.existsSync(dataDir)) nodeFs.mkdirSync(dataDir, { recursive: true })
    if (!nodeFs.existsSync(storeFile)) {
      nodeFs.writeFileSync(storeFile, JSON.stringify({ ...emptyStore(), _contentSeeded: false }, null, 2))
    }
  } else {
    if (!MEMORY_STORE) MEMORY_STORE = { ...emptyStore(), _contentSeeded: false }
  }
}

function readStore(): StoreShape {
  if (canUseFs && nodeFs && nodePath) {
    ensureStore()
    try {
      const raw = nodeFs.readFileSync(storeFile, 'utf-8')
      const data = JSON.parse(raw)
      const seed = seedContent()
      const store: StoreShape = {
        _contentSeeded: data._contentSeeded === true,
        doctors: data.doctors ?? seed.doctors,
        blogPosts: data.blogPosts ?? seed.blogPosts,
        camps: data.camps ?? seed.camps,
        services: data.services ?? seed.services,
        faqs: data.faqs ?? seed.faqs,
        gallery: data.gallery ?? seed.gallery,
        testimonials: data.testimonials ?? seed.testimonials,
        appointments: data.appointments ?? [],
        campRegistrations: data.campRegistrations ?? [],
        contacts: data.contacts ?? [],
        newsletter: data.newsletter ?? [],
        settings: {
          email: { ...DEFAULT_EMAIL_SETTINGS, ...(data.settings?.email ?? {}) },
          site: {
            ...DEFAULT_SITE_SETTINGS,
            ...(data.settings?.site ?? {}),
            phones: { ...DEFAULT_SITE_SETTINGS.phones, ...(data.settings?.site?.phones ?? {}) },
            address: { ...DEFAULT_SITE_SETTINGS.address, ...(data.settings?.site?.address ?? {}) },
            hours: { ...DEFAULT_SITE_SETTINGS.hours, ...(data.settings?.site?.hours ?? {}) },
            social: mergeSocial(data.settings?.site?.social),
          },
          payment: { ...DEFAULT_PAYMENT_SETTINGS, ...(data.settings?.payment ?? {}) },
        },
        activity: data.activity ?? [],
        tpas: data.tpas ?? [],
        media: data.media ?? [],
      }
      if (!store._contentSeeded) {
        store._contentSeeded = true
        writeStore(store)
      }
      return store
    } catch {
      return emptyStore()
    }
  } else {
    // Worker / serverless environment: use in-memory store (non-persistent)
    if (!MEMORY_STORE) MEMORY_STORE = emptyStore()
    return MEMORY_STORE
  }
}

function writeStore(store: StoreShape): void {
  if (canUseFs && nodeFs && nodePath) {
    ensureStore()
    nodeFs.writeFileSync(storeFile, JSON.stringify(store, null, 2))
  } else {
    // update in-memory store
    MEMORY_STORE = store
  }
}

function uid(prefix: string): string {
  return prefix + '-' + Date.now().toString(36).slice(-4).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
}

function sanitize(input: unknown): string {
  return typeof input === 'string' ? input.trim().slice(0, 1000) : ''
}

function itemKey(item: Record<string, unknown>): string {
  return String(item.id ?? item.slug ?? '')
}

const SLUG_COLLECTIONS: StoreCollection[] = ['doctors', 'blogPosts', 'camps', 'services']

const DEFAULTS: Partial<Record<StoreCollection, Record<string, unknown>>> = {
  doctors: {
    title: '',
    email: '',
    specialty: '',
    department: 'General Medicine',
    qualification: '',
    registrationNumber: '',
    registrationCouncil: 'Haryana Medical Council',
    experience: 0,
    gender: 'Male',
    bio: '',
    languages: [],
    availability: { days: [], morning: '', evening: '' },
    opdFees: 0,
    availableToday: true,
    featured: false,
    highlights: [],
    education: [],
  },
  blogPosts: {
    category: 'General Health',
    tags: [],
    author: 'Meenakshi Jain Hospital',
    authorTitle: 'MJ Hospital Team',
    date: new Date().toISOString().slice(0, 10),
    readTime: 3,
    excerpt: '',
    image: '',
    featured: false,
    content: [],
  },
  camps: {
    type: 'Free Checkup',
    time: '9:00 AM – 1:00 PM',
    location: '',
    description: '',
    services: [],
    eligibility: '',
    whatToBring: [],
    capacity: 50,
    registrations: 0,
    organizer: 'Meenakshi Jain Hospital',
    status: 'upcoming',
    image: 'camp1',
    summary: '',
  },
  services: {
    icon: 'building',
    short: '',
    description: '',
    features: [],
    conditions: [],
    procedures: [],
    whyChoose: '',
    departments: [],
  },
  faqs: { category: 'General' },
  gallery: { caption: '' },
  testimonials: { rating: 5 },
  appointments: { status: 'pending', gender: 'Other', mode: 'opd', firstVisit: 'no', email: '' },
  campRegistrations: { gender: 'Other', conditions: [], notes: '' },
}

function uniqueSlug(col: Record<string, unknown>[], base: string): string {
  const cleaned = slugify(base) || 'item'
  let candidate = cleaned
  let i = 1
  const taken = (c: string) => col.some((x) => itemKey(x) === c)
  while (taken(candidate)) candidate = cleaned + '-' + ++i
  return candidate
}

export function getCollection<T = Record<string, unknown>>(key: StoreCollection): T[] {
  return (readStore() as unknown as Record<string, T[]>)[key] ?? []
}

export function getItemById<T = Record<string, unknown>>(key: StoreCollection, id: string): T | undefined {
  return getCollection<Record<string, unknown>>(key).find((x) => itemKey(x) === id) as T | undefined
}

export function createItem(key: StoreCollection, data: Record<string, unknown>): Record<string, unknown> | undefined {
  const store = readStore()
  const col = store[key as keyof StoreShape] as unknown as Record<string, unknown>[]
  const item: Record<string, unknown> = { ...(DEFAULTS[key] || {}), ...data }
  const base = slugify(String(item.name ?? item.title ?? item.question ?? item.email ?? 'item'))
  if (SLUG_COLLECTIONS.includes(key)) {
    item.slug = String(item.slug || uniqueSlug(col, base))
    delete item.id
  } else {
    item.id = String(item.id || uniqueSlug(col, base))
  }
  if (!item.createdAt) item.createdAt = new Date().toISOString()
  col.push(item)
  writeStore(store)
  return item
}

export function updateItem(key: StoreCollection, id: string, data: Record<string, unknown>): Record<string, unknown> | undefined {
  const store = readStore()
  const col = store[key as keyof StoreShape] as unknown as Record<string, unknown>[]
  const idx = col.findIndex((x) => itemKey(x) === id)
  if (idx === -1) return undefined
  const current = col[idx]
  const keyField = SLUG_COLLECTIONS.includes(key) ? 'slug' : 'id'
  const preserved = { ...current, [keyField]: current[keyField] }
  col[idx] = { ...preserved, ...data, [keyField]: current[keyField] }
  writeStore(store)
  return col[idx]
}

export function deleteItem(key: StoreCollection, id: string): boolean {
  const store = readStore()
  const col = store[key as keyof StoreShape] as unknown as Record<string, unknown>[]
  const idx = col.findIndex((x) => itemKey(x) === id)
  if (idx === -1) return false
  col.splice(idx, 1)
  writeStore(store)
  return true
}

export function createAppointment(data: Record<string, unknown>): AppointmentRecord {
  const store = readStore()
  const record: AppointmentRecord = {
    id: uid('MJ'),
    doctor: sanitize(data.doctor),
    service: sanitize(data.service),
    date: sanitize(data.date),
    time: sanitize(data.time),
    patientName: sanitize(data.patientName),
    phone: sanitize(data.phone),
    email: sanitize(data.email).toLowerCase(),
    age: Number(data.age) || 0,
    gender: sanitize(data.gender) || 'Other',
    symptoms: sanitize(data.symptoms),
    firstVisit: sanitize(data.firstVisit),
    mode: sanitize(data.mode) || 'opd',
    createdAt: new Date().toISOString(),
    status: 'pending',
  }
  store.appointments.push(record)
  writeStore(store)
  return record
}

export function createCampRegistration(data: Record<string, unknown>): CampRegistrationRecord {
  const store = readStore()
  const record: CampRegistrationRecord = {
    id: uid('CAMP'),
    campSlug: sanitize(data.campSlug),
    campTitle: sanitize(data.campTitle),
    name: sanitize(data.name),
    age: Number(data.age) || 0,
    phone: sanitize(data.phone),
    email: sanitize(data.email),
    gender: sanitize(data.gender) || 'Other',
    conditions: Array.isArray(data.conditions) ? data.conditions.map(String) : [],
    notes: sanitize(data.notes),
    createdAt: new Date().toISOString(),
  }
  store.campRegistrations.push(record)
  writeStore(store)
  return record
}

export function createContact(data: Record<string, unknown>): ContactRecord {
  const store = readStore()
  const record: ContactRecord = {
    id: uid('CT'),
    name: sanitize(data.name),
    phone: sanitize(data.phone),
    email: sanitize(data.email),
    topic: sanitize(data.topic),
    message: sanitize(data.message),
    createdAt: new Date().toISOString(),
  }
  store.contacts.push(record)
  writeStore(store)
  return record
}

export function createNewsletter(data: Record<string, unknown>): NewsletterRecord {
  const store = readStore()
  const email = sanitize(data.email).toLowerCase()
  const existing = store.newsletter.find((n) => n.email === email)
  if (existing) return existing
  const record: NewsletterRecord = {
    id: uid('NL'),
    email,
    createdAt: new Date().toISOString(),
  }
  store.newsletter.push(record)
  writeStore(store)
  return record
}

export function getSettings(): AppSettingsShape {
  const store = readStore()
  return {
    email: { ...DEFAULT_EMAIL_SETTINGS, ...(store.settings?.email ?? {}) },
    site: store.settings?.site ?? DEFAULT_SITE_SETTINGS,
    payment: { ...DEFAULT_PAYMENT_SETTINGS, ...(store.settings?.payment ?? {}) },
  }
}

export function saveSettings(email: Partial<EmailSettingsRecord>): EmailSettingsRecord {
  const store = readStore()
  const current = { ...DEFAULT_EMAIL_SETTINGS, ...(store.settings?.email ?? {}) }
  const next: EmailSettingsRecord = {
    ...current,
    ...email,
    smtpPort: Number(email.smtpPort ?? current.smtpPort) || current.smtpPort,
    smtpSecure: Boolean(email.smtpSecure ?? current.smtpSecure),
    updatedAt: new Date().toISOString(),
  }
  store.settings = { ...store.settings, email: next }
  writeStore(store)
  return next
}

const ACTIVITY_LIMIT = 2000

export function logActivity(entry: Omit<ActivityRecord, 'id' | 'at'> & { at?: string }): ActivityRecord {
  const store = readStore()
  const record: ActivityRecord = {
    id: uid('ACT'),
    at: entry.at || new Date().toISOString(),
    user: sanitize(entry.user) || 'admin',
    action: sanitize(entry.action),
    collection: sanitize(entry.collection),
    itemId: sanitize(entry.itemId),
    summary: sanitize(entry.summary).slice(0, 500),
  }
  store.activity.unshift(record)
  if (store.activity.length > ACTIVITY_LIMIT) store.activity.length = ACTIVITY_LIMIT
  writeStore(store)
  return record
}

export function getActivity(): ActivityRecord[] {
  return readStore().activity ?? []
}

export function clearActivity(): void {
  const store = readStore()
  store.activity = []
  writeStore(store)
}

export function getSiteSettings(): SiteSettingsRecord {
  const s = readStore().settings?.site
  if (!s) return { ...DEFAULT_SITE_SETTINGS, phones: { ...DEFAULT_SITE_SETTINGS.phones }, address: { ...DEFAULT_SITE_SETTINGS.address }, hours: { ...DEFAULT_SITE_SETTINGS.hours }, social: mergeSocial(undefined) }
  return { ...s, phones: { ...DEFAULT_SITE_SETTINGS.phones, ...s.phones }, address: { ...DEFAULT_SITE_SETTINGS.address, ...s.address }, hours: { ...DEFAULT_SITE_SETTINGS.hours, ...s.hours }, social: mergeSocial(s.social) }
}

export function saveSiteSettings(patch: Partial<SiteSettingsRecord>): SiteSettingsRecord {
  const store = readStore()
  const current = store.settings?.site ?? DEFAULT_SITE_SETTINGS
  const next: SiteSettingsRecord = {
    email: patch.email !== undefined ? String(patch.email).trim() : current.email,
    phones: { ...current.phones, ...(patch.phones ?? {}) },
    address: { ...current.address, ...(patch.address ?? {}) },
    hours: { ...current.hours, ...(patch.hours ?? {}) },
    social: patch.social ? mergeSocial(patch.social) : mergeSocial(current.social),
    updatedAt: new Date().toISOString(),
  }
  store.settings = { ...store.settings, site: next }
  writeStore(store)
  return next
}

export function getPaymentSettings(): PaymentSettingsRecord {
  return { ...DEFAULT_PAYMENT_SETTINGS, ...(readStore().settings?.payment ?? {}) }
}

export function savePaymentSettings(patch: Partial<PaymentSettingsRecord>): PaymentSettingsRecord {
  const store = readStore()
  const current = { ...DEFAULT_PAYMENT_SETTINGS, ...(store.settings?.payment ?? {}) }
  const next: PaymentSettingsRecord = { ...current, ...patch, updatedAt: new Date().toISOString() }
  store.settings = { ...store.settings, payment: next }
  writeStore(store)
  return next
}

export function getTpas(): TpaRepository[] {
  return readStore().tpas ?? []
}

export function getActiveTpas(): TpaRepository[] {
  return getTpas().filter((t) => t.active)
}

export function createTpa(data: Partial<TpaRepository>): TpaRepository {
  const store = readStore()
  const record: TpaRepository = {
    id: uid('TPA'),
    name: sanitize(data.name),
    type: data.type === 'tpa' ? 'tpa' : 'insurer',
    logo: sanitize(data.logo),
    helpline: sanitize(data.helpline),
    email: sanitize(data.email),
    cashless: Boolean(data.cashless),
    notes: sanitize(data.notes),
    active: data.active !== false,
    createdAt: new Date().toISOString(),
  }
  store.tpas.push(record)
  writeStore(store)
  return record
}

export function updateTpa(id: string, data: Partial<TpaRepository>): TpaRepository | undefined {
  const store = readStore()
  const idx = store.tpas.findIndex((t) => t.id === id)
  if (idx === -1) return undefined
  const current = store.tpas[idx]
  store.tpas[idx] = {
    ...current,
    ...data,
    id: current.id,
    name: data.name !== undefined ? sanitize(data.name) : current.name,
    logo: data.logo !== undefined ? sanitize(data.logo) : current.logo,
    helpline: data.helpline !== undefined ? sanitize(data.helpline) : current.helpline,
    email: data.email !== undefined ? sanitize(data.email) : current.email,
    notes: data.notes !== undefined ? sanitize(data.notes) : current.notes,
    cashless: data.cashless !== undefined ? Boolean(data.cashless) : current.cashless,
    active: data.active !== undefined ? Boolean(data.active) : current.active,
  }
  writeStore(store)
  return store.tpas[idx]
}

export function deleteTpa(id: string): boolean {
  const store = readStore()
  const idx = store.tpas.findIndex((t) => t.id === id)
  if (idx === -1) return false
  store.tpas.splice(idx, 1)
  writeStore(store)
  return true
}

const MAX_MEDIA_BYTES = 4 * 1024 * 1024

export function getMedia(): MediaRecord[] {
  return readStore().media ?? []
}

export function getVisibleMedia(): MediaRecord[] {
  return getMedia().filter((m) => m.visible)
}

export function getMediaById(id: string): MediaRecord | undefined {
  return getMedia().find((m) => m.id === id)
}

export function createMedia(data: {
  filename: string
  mime: string
  size: number
  data: string
  alt?: string
  folder?: string
  visible?: boolean
}): MediaRecord {
  if (data.size > MAX_MEDIA_BYTES) throw new Error('File is larger than the 4 MB limit.')
  const store = readStore()
  const record: MediaRecord = {
    id: uid('IMG'),
    filename: sanitize(data.filename).slice(0, 200),
    mime: sanitize(data.mime),
    size: data.size,
    data: data.data,
    alt: sanitize(data.alt || ''),
    folder: sanitize(data.folder || 'general'),
    visible: data.visible !== false,
    uploadedAt: new Date().toISOString(),
  }
  store.media.unshift(record)
  writeStore(store)
  return record
}

export function updateMedia(id: string, data: { alt?: string; folder?: string; visible?: boolean; filename?: string }): MediaRecord | undefined {
  const store = readStore()
  const idx = store.media.findIndex((m) => m.id === id)
  if (idx === -1) return undefined
  const current = store.media[idx]
  store.media[idx] = {
    ...current,
    alt: data.alt !== undefined ? sanitize(data.alt) : current.alt,
    folder: data.folder !== undefined ? sanitize(data.folder) : current.folder,
    filename: data.filename !== undefined ? sanitize(data.filename).slice(0, 200) : current.filename,
    visible: data.visible !== undefined ? Boolean(data.visible) : current.visible,
  }
  writeStore(store)
  return store.media[idx]
}

export function deleteMedia(id: string): boolean {
  const store = readStore()
  const idx = store.media.findIndex((m) => m.id === id)
  if (idx === -1) return false
  store.media.splice(idx, 1)
  writeStore(store)
  return true
}
