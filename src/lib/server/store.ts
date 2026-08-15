import fs from 'node:fs'
import path from 'node:path'
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
}

const dataDir = path.resolve(process.cwd(), 'data')
const storeFile = path.join(dataDir, 'store.json')

function seedContent(): Omit<StoreShape, 'appointments' | 'campRegistrations' | 'contacts' | 'newsletter'> {
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
  }
}

function ensureStore(): void {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(storeFile, JSON.stringify({ ...emptyStore(), _contentSeeded: false }, null, 2))
  }
}

function readStore(): StoreShape {
  ensureStore()
  try {
    const raw = fs.readFileSync(storeFile, 'utf-8')
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
    }
    if (!store._contentSeeded) {
      store._contentSeeded = true
      writeStore(store)
    }
    return store
  } catch {
    return emptyStore()
  }
}

function writeStore(store: StoreShape): void {
  ensureStore()
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2))
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
