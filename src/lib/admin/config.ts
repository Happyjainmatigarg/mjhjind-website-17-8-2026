import { departments } from '../../data/doctors'
import { blogCategories } from '../../data/blog'
import { faqCategories } from '../../data/faqs'
import { campTypes } from '../../data/camps'
import { galleryCategories } from '../../data/gallery'

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'list' | 'toggle' | 'blocks'

export interface FieldConfig {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: string[]
  help?: string
  rows?: number
}

export interface CollectionConfig {
  name: string
  label: string
  icon: string
  description: string
  columns: string[]
  fields: FieldConfig[]
  searchKeys: string[]
  keyLabel: string
  create?: boolean
  edit?: boolean
  remove?: boolean
  statusField?: string
  statusOptions?: string[]
}

export const adminCollections: CollectionConfig[] = [
  {
    name: 'appointments',
    label: 'Appointments',
    icon: 'calendar',
    description: 'Appointment booking requests submitted through the website.',
    columns: ['patientName', 'doctor', 'date', 'time', 'phone', 'status', 'createdAt'],
    fields: [
      { key: 'patientName', label: 'Patient Name', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', help: 'Used for email confirmation and notifications' },
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
      { key: 'doctor', label: 'Doctor / Service', type: 'text' },
      { key: 'service', label: 'Department', type: 'text' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'time', label: 'Time', type: 'text' },
      { key: 'symptoms', label: 'Symptoms / Notes', type: 'textarea', rows: 3 },
      { key: 'firstVisit', label: 'First Visit?', type: 'select', options: ['yes', 'no'] },
      { key: 'mode', label: 'Visit Mode', type: 'select', options: ['opd', 'teleconsult'] },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'confirmed', 'completed', 'cancelled'] },
    ],
    searchKeys: ['patientName', 'phone', 'doctor', 'id'],
    keyLabel: 'Appointment ID',
    statusField: 'status',
    statusOptions: ['pending', 'confirmed', 'completed', 'cancelled'],
  },
  {
    name: 'campRegistrations',
    label: 'Camp Registrations',
    icon: 'clipboard',
    description: 'Registrations for community health camps.',
    columns: ['name', 'campTitle', 'phone', 'age', 'createdAt'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
      { key: 'campTitle', label: 'Camp', type: 'text' },
      { key: 'campSlug', label: 'Camp Slug', type: 'text' },
      { key: 'conditions', label: 'Health Conditions', type: 'list' },
      { key: 'notes', label: 'Notes', type: 'textarea', rows: 3 },
    ],
    searchKeys: ['name', 'phone', 'campTitle', 'id'],
    keyLabel: 'Registration ID',
  },
  {
    name: 'contacts',
    label: 'Contact Messages',
    icon: 'chat',
    description: 'Messages submitted through the contact form.',
    columns: ['name', 'email', 'phone', 'topic', 'createdAt'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'topic', label: 'Topic', type: 'text' },
      { key: 'message', label: 'Message', type: 'textarea', rows: 4, required: true },
    ],
    searchKeys: ['name', 'email', 'phone', 'message', 'id'],
    keyLabel: 'Message ID',
  },
  {
    name: 'newsletter',
    label: 'Newsletter Subscribers',
    icon: 'mail',
    description: 'Email addresses subscribed to health updates.',
    columns: ['email', 'createdAt'],
    fields: [{ key: 'email', label: 'Email', type: 'text', required: true }],
    searchKeys: ['email', 'id'],
    keyLabel: 'Subscriber ID',
    create: false,
  },
  {
    name: 'doctors',
    label: 'Doctors',
    icon: 'user-group',
    description: 'Doctor profiles shown on the website. Slugs are auto-generated from names.',
    columns: ['name', 'specialty', 'qualification', 'experience', 'featured', 'availableToday'],
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g. Dr. Amit Sharma' },
      { key: 'title', label: 'Title', type: 'text', placeholder: 'e.g. Consultant Physician' },
      { key: 'email', label: 'Email', type: 'text', help: 'Used for appointment notifications to this doctor' },
      { key: 'specialty', label: 'Specialty', type: 'text', required: true, placeholder: 'e.g. Cardiology' },
      { key: 'department', label: 'Department', type: 'select', options: departments, required: true },
      { key: 'qualification', label: 'Qualification', type: 'text', placeholder: 'e.g. MBBS, MD (Medicine)' },
      { key: 'registrationNumber', label: 'Registration Number', type: 'text' },
      { key: 'registrationCouncil', label: 'Registration Council', type: 'text', placeholder: 'e.g. Haryana Medical Council' },
      { key: 'experience', label: 'Experience (years)', type: 'number' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] },
      { key: 'bio', label: 'Bio', type: 'textarea', rows: 4 },
      { key: 'languages', label: 'Languages', type: 'list' },
      { key: 'availability.days', label: 'Available Days', type: 'list', help: 'e.g. Mon, Tue, Wed' },
      { key: 'availability.morning', label: 'Morning Hours', type: 'text', placeholder: 'e.g. 9 AM – 2 PM' },
      { key: 'availability.evening', label: 'Evening Hours', type: 'text', placeholder: 'e.g. 4 PM – 7 PM' },
      { key: 'opdFees', label: 'OPD Fee (₹)', type: 'number' },
      { key: 'availableToday', label: 'Available Today', type: 'toggle' },
      { key: 'featured', label: 'Featured on Homepage', type: 'toggle' },
      { key: 'highlights', label: 'Highlights', type: 'list', help: 'One per line' },
      { key: 'education', label: 'Education', type: 'list', help: 'One per line' },
    ],
    searchKeys: ['name', 'specialty', 'qualification'],
    keyLabel: 'Slug',
    statusField: 'availableToday',
    statusOptions: ['false', 'true'],
  },
  {
    name: 'blogPosts',
    label: 'Blog Posts',
    icon: 'document',
    description: 'Health articles written by our doctors.',
    columns: ['title', 'category', 'author', 'date', 'readTime'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: blogCategories },
      { key: 'tags', label: 'Tags', type: 'list', help: 'One per line' },
      { key: 'author', label: 'Author', type: 'text' },
      { key: 'authorTitle', label: 'Author Title', type: 'text', placeholder: 'e.g. Consultant Cardiologist' },
      { key: 'date', label: 'Publish Date', type: 'date' },
      { key: 'readTime', label: 'Read Time (minutes)', type: 'number' },
      { key: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 3 },
      { key: 'image', label: 'Image', type: 'text', help: 'Placeholder key, e.g. blog-heart' },
      { key: 'featured', label: 'Featured', type: 'toggle' },
      { key: 'content', label: 'Content', type: 'blocks', rows: 12, help: 'Separate paragraphs with a blank line. Start a line with ### for a heading, - for bullets, 1. for numbered, > for quote.' },
    ],
    searchKeys: ['title', 'category', 'author', 'excerpt'],
    keyLabel: 'Slug',
  },
  {
    name: 'camps',
    label: 'Health Camps',
    icon: 'heart',
    description: 'Free health camps organized across Jind.',
    columns: ['title', 'type', 'date', 'location', 'status', 'registrations'],
    fields: [
      { key: 'title', label: 'Camp Title', type: 'text', required: true },
      { key: 'type', label: 'Camp Type', type: 'select', options: campTypes },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'time', label: 'Time', type: 'text', placeholder: 'e.g. 8:00 AM – 2:00 PM' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea', rows: 4 },
      { key: 'services', label: 'Services Offered', type: 'list' },
      { key: 'eligibility', label: 'Eligibility', type: 'textarea', rows: 2 },
      { key: 'whatToBring', label: 'What to Bring', type: 'list' },
      { key: 'capacity', label: 'Capacity', type: 'number' },
      { key: 'registrations', label: 'Registrations Count', type: 'number' },
      { key: 'organizer', label: 'Organizer', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['upcoming', 'past'] },
      { key: 'image', label: 'Image', type: 'text', help: 'Placeholder key, e.g. camp1' },
      { key: 'summary', label: 'Summary (optional)', type: 'textarea', rows: 2 },
    ],
    searchKeys: ['title', 'type', 'location'],
    keyLabel: 'Slug',
    statusField: 'status',
    statusOptions: ['upcoming', 'past'],
  },
  {
    name: 'services',
    label: 'Services',
    icon: 'building',
    description: 'Departments and services offered by the hospital.',
    columns: ['title', 'short', 'icon'],
    fields: [
      { key: 'title', label: 'Service Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug (URL)', type: 'text', help: 'Leave blank to auto-generate' },
      { key: 'icon', label: 'Icon', type: 'text', placeholder: 'e.g. heart' },
      { key: 'short', label: 'Short Description', type: 'textarea', rows: 2 },
      { key: 'description', label: 'Description', type: 'textarea', rows: 4 },
      { key: 'features', label: 'Features', type: 'list' },
      { key: 'conditions', label: 'Conditions Treated', type: 'list' },
      { key: 'procedures', label: 'Procedures', type: 'list' },
      { key: 'whyChoose', label: 'Why Choose Us', type: 'textarea', rows: 3 },
      { key: 'departments', label: 'Related Departments', type: 'list' },
    ],
    searchKeys: ['title', 'short', 'description'],
    keyLabel: 'Slug',
  },
  {
    name: 'faqs',
    label: 'FAQs',
    icon: 'chat',
    description: 'Frequently asked questions shown on the FAQ page and homepage.',
    columns: ['question', 'category'],
    fields: [
      { key: 'question', label: 'Question', type: 'text', required: true },
      { key: 'answer', label: 'Answer', type: 'textarea', rows: 4, required: true },
      { key: 'category', label: 'Category', type: 'select', options: faqCategories },
    ],
    searchKeys: ['question', 'answer', 'category'],
    keyLabel: 'ID',
  },
  {
    name: 'gallery',
    label: 'Gallery',
    icon: 'camera',
    description: 'Images shown in the hospital gallery.',
    columns: ['title', 'category', 'image'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: galleryCategories },
      { key: 'image', label: 'Image', type: 'text', placeholder: 'e.g. reception' },
      { key: 'caption', label: 'Caption', type: 'textarea', rows: 2 },
    ],
    searchKeys: ['title', 'category', 'caption'],
    keyLabel: 'ID',
  },
  {
    name: 'testimonials',
    label: 'Testimonials',
    icon: 'star',
    description: 'Patient reviews shown on the homepage.',
    columns: ['name', 'location', 'treatment', 'rating'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'rating', label: 'Rating (1–5)', type: 'number' },
      { key: 'quote', label: 'Quote', type: 'textarea', rows: 4, required: true },
      { key: 'treatment', label: 'Treatment', type: 'text' },
    ],
    searchKeys: ['name', 'treatment', 'quote'],
    keyLabel: 'ID',
  },
]

export const adminCollectionsByKey = Object.fromEntries(adminCollections.map((c) => [c.name, c]))

export function getAdminConfig(name: string): CollectionConfig | undefined {
  return adminCollectionsByKey[name]
}
