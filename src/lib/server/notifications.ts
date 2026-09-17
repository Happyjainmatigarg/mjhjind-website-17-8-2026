import { emailRow, escapeHtml, hospital, sendMail, siteUrl, wrapEmailHtml } from './mailer'
import { getEmailConfig } from './settings'
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

async function adminEmails(): Promise<string[]> {
  return (await getEmailConfig()).adminNotifyEmails
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

function send(to: string, subject: string, title: string, bodyHtml: string, text: string) {
  return sendMail({ to, subject, html: wrapEmailHtml(title, bodyHtml), text })
}

export async function sendAppointmentRequestedToPatient(a: AppointmentRecord): Promise<boolean> {
  if (!a.email) return false
  const body = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">Dear <strong>${escapeHtml(a.patientName)}</strong>,</p>
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">Thank you for requesting an appointment with ${escapeHtml(hospital.name)}. Your request has been received. Our team will review it and send you a confirmation shortly.</p>
  <p style="margin:0 0 8px;color:#374151;font-size:14px;font-weight:600;">Your appointment request summary</p>
  ${appointmentTable(a)}
  <p style="margin:14px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">Please carry any previous prescriptions or reports when you visit. For urgent needs, call our emergency number: <strong>${escapeHtml(hospital.phones.emergency)}</strong>.</p>`
  return send(
    a.email,
    `Appointment request received — ${a.id}`,
    'Appointment Request Received',
    body,
    `Dear ${a.patientName}, your appointment request (${a.id}) for ${a.doctor || a.service || 'General OPD'} on ${formatDate(a.date)} at ${formatTime(a.time)} has been received. We will send a confirmation shortly.`,
  )
}

export async function sendAppointmentStatusToPatient(a: AppointmentRecord): Promise<boolean> {
  if (!a.email) return false
  const statusText: Record<string, string> = {
    confirmed: 'Your appointment has been confirmed.',
    completed: 'Your appointment has been marked as completed. We hope you had a smooth visit.',
    cancelled: 'Your appointment has been cancelled. Please contact us to reschedule.',
  }
  const message = statusText[a.status] || 'Your appointment status has been updated.'
  const body = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">Dear <strong>${escapeHtml(a.patientName)}</strong>,</p>
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">${escapeHtml(message)}</p>
  ${appointmentTable(a)}
  ${a.status === 'confirmed' ? `<p style="margin:14px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">We look forward to seeing you at ${escapeHtml(hospital.name)}. For any changes, please call <strong>${escapeHtml(hospital.phones.appointment)}</strong>.</p>` : ''}`
  return send(a.email, `Appointment ${a.status} — ${a.id}`, `Appointment ${a.status}`, body, `Dear ${a.patientName}, ${message}`)
}

/** Admin-triggered confirmation. Uses the confirmed message regardless of stored status. */
export async function sendAppointmentConfirmationToPatient(a: AppointmentRecord): Promise<boolean> {
  return sendAppointmentStatusToPatient({ ...a, status: 'confirmed' })
}

/** Admin-triggered resend of the original request-received email. */
export async function resendAppointmentRequestToPatient(a: AppointmentRecord): Promise<boolean> {
  return sendAppointmentRequestedToPatient(a)
}

export async function sendCampConfirmation(r: CampRegistrationRecord): Promise<boolean> {
  return sendCampRegistrationToPatient(r)
}

export async function notifyAdminAppointment(a: AppointmentRecord): Promise<boolean> {
  const to = await adminEmails()
  if (!to.length) return false
  const body = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">A new appointment request was submitted through the website.</p>
  ${appointmentTable(a)}
  <p style="margin:14px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">Manage it in the admin panel: <a href="${siteUrl()}/admin" style="color:#2d5f8a;">${siteUrl()}/admin</a></p>`
  return send(to.join(', '), `New appointment request — ${a.id}`, 'New Appointment Request', body, `New appointment request ${a.id} from ${a.patientName} for ${a.doctor || a.service} on ${formatDate(a.date)}.`)
}

export async function notifyDoctorAppointment(a: AppointmentRecord, doctor?: Doctor): Promise<boolean> {
  if (!doctor?.email) return false
  const body = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">Dear <strong>${escapeHtml(doctor.name)}</strong>,</p>
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">A patient has requested an appointment with you.</p>
  ${appointmentTable(a)}
  <p style="margin:14px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">Review the request in the admin panel: <a href="${siteUrl()}/admin" style="color:#2d5f8a;">${siteUrl()}/admin</a></p>`
  return send(doctor.email, `New appointment request for you — ${a.id}`, 'New Appointment Request', body, `New appointment request ${a.id} from ${a.patientName} on ${formatDate(a.date)} at ${formatTime(a.time)}.`)
}

export async function sendCampRegistrationToPatient(r: CampRegistrationRecord): Promise<boolean> {
  if (!r.email) return false
  const body = `
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
  return send(r.email, `Camp registration confirmed — ${r.campTitle}`, 'Camp Registration Confirmed', body, `Dear ${r.name}, your registration for ${r.campTitle} (${r.id}) is confirmed.`)
}

export async function notifyAdminCampRegistration(r: CampRegistrationRecord): Promise<boolean> {
  const to = await adminEmails()
  if (!to.length) return false
  const body = `
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
  return send(to.join(', '), `New camp registration — ${r.campTitle}`, 'New Camp Registration', body, `New registration ${r.id} from ${r.name} for ${r.campTitle}.`)
}

export async function notifyAdminContact(c: ContactRecord): Promise<boolean> {
  const to = await adminEmails()
  if (!to.length) return false
  const body = `
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
  return send(to.join(', '), `New contact message — ${c.name}`, 'New Contact Message', body, `New contact message from ${c.name} (${c.topic || 'General'}): ${c.message}`)
}

export async function sendNewsletterWelcomeToSubscriber(email: string): Promise<boolean> {
  const body = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">Hello,</p>
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">Thank you for subscribing to health updates from <strong>${escapeHtml(hospital.name)}</strong>. You will receive practical health tips, camp announcements and hospital updates in your inbox.</p>
  <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">You can unsubscribe at any time by contacting our reception at <strong>${escapeHtml(hospital.phones.appointment)}</strong>.</p>`
  return send(email, `Welcome to ${hospital.name} health updates`, 'Welcome', body, `Thank you for subscribing to health updates from ${hospital.name}.`)
}

export async function notifyAdminNewsletter(email: string): Promise<boolean> {
  const to = await adminEmails()
  if (!to.length) return false
  const body = `
  <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">A new subscriber joined the health newsletter.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0;">
    ${emailRow('Email', email)}
  </table>`
  return send(to.join(', '), `New newsletter subscriber — ${email}`, 'New Subscriber', body, `New newsletter subscriber: ${email}`)
}
