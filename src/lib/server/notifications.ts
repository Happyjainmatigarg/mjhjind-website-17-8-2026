import { emailRow, escapeHtml, hospital, sendMail, siteUrl } from './mailer'
import type { AppointmentRecord, CampRegistrationRecord, ContactRecord } from './store'
import type { Doctor } from '../../data/doctors'

function formatDate(date: string): string {
  if (!date) return '—'
  const d = new Date(date + 'T00:00:00')
  if (isNaN(d.getTime())) return date
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(time: string): string {
  if (!time) return '—'
  return time
}

function appointmentTable(a: AppointmentRecord): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0;">
    ${emailRow('Booking ID', a.id)}
    ${emailRow('Patient Name', a.patientName)}
    ${emailRow('Doctor / Department', a.doctor || a.service || 'General OPD')}
    ${emailRow('Appointment Date', formatDate(a.date))}
    ${emailRow('Time Slot', formatTime(a.time))}
    ${emailRow('Phone', a.phone)}
    ${emailRow('Age', String(a.age))}
    ${emailRow('Gender', a.gender)}
    ${a.symptoms ? emailRow('Symptoms / Notes', a.symptoms) : ''}
  </table>`
}

export async function sendAppointmentRequestedToPatient(a: AppointmentRecord): Promise<boolean> {
  if (!a.email) return false
  const html = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">Dear <strong>${escapeHtml(a.patientName)}</strong>,</p>
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">Thank you for booking an appointment with ${escapeHtml(hospital.name)}. Your request has been received and our team will call you on <strong>${escapeHtml(a.phone)}</strong> within 30 minutes during working hours to confirm the exact slot.</p>
  <p style="margin:0 0 8px;color:#374151;font-size:14px;font-weight:600;">Your appointment request summary</p>
  ${appointmentTable(a)}
  <p style="margin:14px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">Please carry any previous prescriptions or reports when you visit. For urgent needs, call our emergency number: <strong>${escapeHtml(hospital.phones.emergency)}</strong>.</p>`
  return sendMail({
    to: a.email,
    subject: `Appointment request received — ${a.id}`,
    html,
    text: `Dear ${a.patientName}, your appointment request (${a.id}) for ${a.doctor || a.service || 'General OPD'} on ${formatDate(a.date)} at ${formatTime(a.time)} has been received. We will confirm by phone on ${a.phone}.`,
  })
}

export async function sendAppointmentStatusToPatient(a: AppointmentRecord): Promise<boolean> {
  if (!a.email) return false
  const statusText: Record<string, string> = {
    confirmed: 'Your appointment has been confirmed.',
    completed: 'Your appointment has been marked as completed. We hope you had a smooth visit.',
    cancelled: 'Your appointment has been cancelled. Please contact us to reschedule.',
  }
  const message = statusText[a.status] || 'Your appointment status has been updated.'
  const html = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">Dear <strong>${escapeHtml(a.patientName)}</strong>,</p>
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">${escapeHtml(message)}</p>
  ${appointmentTable(a)}
  ${a.status === 'confirmed' ? `<p style="margin:14px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">We look forward to seeing you at ${escapeHtml(hospital.name)}. For any changes, please call <strong>${escapeHtml(hospital.phones.appointment)}</strong>.</p>` : ''}`
  return sendMail({
    to: a.email,
    subject: `Appointment ${a.status} — ${a.id}`,
    html,
    text: `Dear ${a.patientName}, ${message}`,
  })
}

export async function notifyAdminAppointment(a: AppointmentRecord): Promise<boolean> {
  const to = adminEmails()
  if (!to.length) return false
  const html = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">A new appointment request was submitted through the website.</p>
  ${appointmentTable(a)}
  <p style="margin:14px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">Manage it in the admin panel: <a href="${siteUrl()}/admin" style="color:#2d5f8a;">${siteUrl()}/admin</a></p>`
  return sendMail({
    to: to.join(', '),
    subject: `New appointment request — ${a.id}`,
    html,
    text: `New appointment request ${a.id} from ${a.patientName} for ${a.doctor || a.service} on ${formatDate(a.date)}.`,
  })
}

export async function notifyDoctorAppointment(a: AppointmentRecord, doctor?: Doctor): Promise<boolean> {
  if (!doctor?.email) return false
  const html = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">Dear <strong>${escapeHtml(doctor.name)}</strong>,</p>
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">A patient has requested an appointment with you.</p>
  ${appointmentTable(a)}
  <p style="margin:14px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">Review the request in the admin panel: <a href="${siteUrl()}/admin" style="color:#2d5f8a;">${siteUrl()}/admin</a></p>`
  return sendMail({
    to: doctor.email,
    subject: `New appointment request for you — ${a.id}`,
    html,
    text: `New appointment request ${a.id} from ${a.patientName} on ${formatDate(a.date)} at ${formatTime(a.time)}.`,
  })
}

export async function sendCampRegistrationToPatient(r: CampRegistrationRecord): Promise<boolean> {
  if (!r.email) return false
  const html = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">Dear <strong>${escapeHtml(r.name)}</strong>,</p>
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">Thank you for registering for the health camp <strong>${escapeHtml(r.campTitle)}</strong>. Your registration is confirmed.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0;">
    ${emailRow('Registration ID', r.id)}
    ${emailRow('Camp', r.campTitle)}
    ${emailRow('Name', r.name)}
    ${emailRow('Age', String(r.age))}
    ${emailRow('Phone', r.phone)}
    ${r.conditions.length ? emailRow('Health Conditions', r.conditions.join(', ')) : ''}
  </table>
  <p style="margin:14px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">Please arrive on time and carry any relevant reports. For questions, call <strong>${escapeHtml(hospital.phones.appointment)}</strong>.</p>`
  return sendMail({
    to: r.email,
    subject: `Camp registration confirmed — ${r.campTitle}`,
    html,
    text: `Dear ${r.name}, your registration for ${r.campTitle} (${r.id}) is confirmed.`,
  })
}

export async function notifyAdminCampRegistration(r: CampRegistrationRecord): Promise<boolean> {
  const to = adminEmails()
  if (!to.length) return false
  const html = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">A new registration was received for the health camp <strong>${escapeHtml(r.campTitle)}</strong>.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0;">
    ${emailRow('Registration ID', r.id)}
    ${emailRow('Camp', r.campTitle)}
    ${emailRow('Name', r.name)}
    ${emailRow('Age', String(r.age))}
    ${emailRow('Phone', r.phone)}
    ${emailRow('Email', r.email || '—')}
    ${r.conditions.length ? emailRow('Health Conditions', r.conditions.join(', ')) : ''}
    ${r.notes ? emailRow('Notes', r.notes) : ''}
  </table>
  <p style="margin:14px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">Manage registrations in the admin panel: <a href="${siteUrl()}/admin" style="color:#2d5f8a;">${siteUrl()}/admin</a></p>`
  return sendMail({
    to: to.join(', '),
    subject: `New camp registration — ${r.campTitle}`,
    html,
    text: `New registration ${r.id} from ${r.name} for ${r.campTitle}.`,
  })
}

export async function notifyAdminContact(c: ContactRecord): Promise<boolean> {
  const to = adminEmails()
  if (!to.length) return false
  const html = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">A new message was submitted through the contact form.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0;">
    ${emailRow('Message ID', c.id)}
    ${emailRow('Name', c.name)}
    ${emailRow('Phone', c.phone)}
    ${emailRow('Email', c.email)}
    ${emailRow('Topic', c.topic)}
    ${emailRow('Message', c.message)}
  </table>
  <p style="margin:14px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">Reply in the admin panel: <a href="${siteUrl()}/admin" style="color:#2d5f8a;">${siteUrl()}/admin</a></p>`
  return sendMail({
    to: to.join(', '),
    subject: `New contact message — ${c.name}`,
    html,
    text: `New contact message from ${c.name} (${c.topic || 'General'}): ${c.message}`,
  })
}

export async function sendNewsletterWelcomeToSubscriber(email: string): Promise<boolean> {
  const html = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">Hello,</p>
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">Thank you for subscribing to health updates from <strong>${escapeHtml(hospital.name)}</strong>. You will receive practical health tips, camp announcements and hospital updates in your inbox.</p>
  <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">You can unsubscribe at any time by contacting our reception at <strong>${escapeHtml(hospital.phones.appointment)}</strong>.</p>`
  return sendMail({
    to: email,
    subject: `Welcome to ${hospital.name} health updates`,
    html,
    text: `Thank you for subscribing to health updates from ${hospital.name}.`,
  })
}

export async function notifyAdminNewsletter(email: string): Promise<boolean> {
  const to = adminEmails()
  if (!to.length) return false
  const html = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">A new subscriber joined the health newsletter.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0;">
    ${emailRow('Email', email)}
  </table>`
  return sendMail({
    to: to.join(', '),
    subject: `New newsletter subscriber — ${email}`,
    html,
    text: `New newsletter subscriber: ${email}`,
  })
}

function adminEmails(): string[] {
  return (process.env.ADMIN_NOTIFY_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}
