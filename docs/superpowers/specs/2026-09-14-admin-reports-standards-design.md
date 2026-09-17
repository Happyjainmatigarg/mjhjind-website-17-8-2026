# MJH Website — Admin Suite, Reports/MIS, Exports & Standards Compliance

Date: 2026-09-14
Status: Approved for implementation
Owner: Meenakshi Jain Hospital (Jind, Haryana)

## 1. Goal

Expand the admin panel with email configuration, confirmation sending, printouts,
activity logging, analytics, MIS reports and multi-format exports, and close the
gaps found in the website audit against Indian and international standards
(DPDP Act 2023, NABH, MoHFW patient-rights charter, Telemedicine Practice
Guidelines 2020, WCAG 2.1 AA / IS 17802, schema.org, PWA, security headers).

## 2. Constraints

- Astro 5 + Tailwind, `output: 'static'` + `@astrojs/node` standalone; admin/API
  routes are `prerender = false`.
- Cloudflare Workers compatible: no top-level `node:fs` / `node:crypto` /
  `nodemailer` imports in any module reachable at the edge.
- The Workers store is in-memory; Node local dev persists to `data/store.json`.
- No new runtime dependencies. Exports and charts are dependency-free
  (client-side), PDF via the browser print dialog ("Save as PDF").
- Secrets must never be returned to the browser.

## 3. Admin features

### 3.1 Email settings (`/admin/settings`)
- Email config stored in the store under `settings.email`.
- Modes: `auto | smtp | api`. Auto = API on Workers, SMTP on Node.
- SMTP: host, port, secure, user, pass. API: provider (`resend`, `sendgrid`,
  `brevo`) + API key. Common: from-name, from-email, admin notify emails.
- Secrets encrypted at rest with AES-GCM (Web Crypto). Key derived from
  `ADMIN_SETTINGS_SECRET` || `ADMIN_SESSION_SECRET` || admin password.
- API returns masked config (booleans/partials only) plus `test` action.

### 3.2 Confirmation & notification sending
- Appointment actions: "Send confirmation" (status-based email) and "Resend"
  (request-received email).
- Camp registration action: "Send confirmation".
- Every send is logged to the activity trail.

### 3.3 Printouts
- Single appointment slip (hospital header, patient, doctor, date/time, ID).
- Day list: date picker -> printable list of that day's appointments.
- Hidden `#admin-print` container + `@media print` rules (no popups).

### 3.4 Activity log (`/admin/activity`)
- `activity` array records: login, create, update, delete, status change,
  email sent, settings change. Fields: id, at, user, action, collection, itemId,
  summary. Filter by action/collection; paginated.

### 3.5 Dashboard analytics
- `/api/admin/analytics?range=7|30|90|all`.
- KPIs: pending/confirmed appointments, messages, camp registrations,
  subscribers. Breakdowns: appointments by status, by day, by doctor/department,
  form volumes, newsletter growth. Recent activity feed. Range selector.
- Charts: inline SVG/CSS bars, no dependency.

### 3.6 Reports & MIS (`/admin/reports`)
- Report builder: choose dataset + date range, view summary + table.
- Export formats: CSV, Excel (`.xls` SpreadsheetML), Word (`.doc`), PDF (print),
  JSON. Print view. MIS summary with totals and period comparisons.

### 3.7 Export utility
- `src/lib/export.ts` client helper: `exportCsv`, `exportExcel`, `exportWord`,
  `exportJson`, `printReport`.

## 4. Standards & compliance additions

### 4.1 Technical/SEO
- `lang="en-IN"`, `dir="ltr"`, SVG favicon, Apple web-app metas,
  `msapplication-config`, `og:image:alt`, `twitter:image:alt`, RSS link.
- `Seo.astro`: conditional robots (fix 404 double tag), ContactPoint,
  24x7 emergency opening hours, WebSite + SearchAction, Organization node.
- `robots.txt`: disallow `/admin`, `/api`.
- `site.webmanifest`: `scope`, `id`, `lang`, maskable icon.
- `public/_headers`: HSTS, CSP, nosniff, referrer-policy, frame-options,
  permissions-policy.
- BreadcrumbList JSON-LD on doctor/service/camp detail pages; fix invalid
  `MedicalEvent` -> `Event` and `MedicalBusiness` -> `Service`.
- Sitemap: add new legal/patient pages.

### 4.2 Legal & patient-information pages (new)
- `/patient-rights` — MoHFW Charter of Patients' Rights + responsibilities.
- `/grievance` — grievance officer, complaint form, SLA, escalation matrix.
- `/refund-cancellation` — refund & cancellation/no-show policy.
- `/insurance` — empanelled insurers/TPAs, cashless process, documents.
- `/telemedicine` — teleconsultation terms/consent (TPG 2020).
- `/accessibility` — WCAG 2.1 AA / IS 17802 / RPwD statement.
- `/patient-guide` — visiting hours, admission, attendants, what to bring.
- `/hospital-information` — registered entity, licences, accreditation, contacts.
- Privacy policy: DPDP Act 2023 notice, retention schedule, grievance officer,
  child age 18, third-party processors.
- Terms: cancellation/no-show, payments/billing, telemedicine cross-links.

### 4.3 Corrections
- Emergency numbers: unified `112`, ambulance `108`; remove the incorrect
  claim that `102` is the hospital ambulance line; keep the hospital line
  consistently.
- Newsletter consent checkbox + privacy link.
- Footer legal/patient links.

## 5. Build order

1. Store extensions + crypto-box + settings module + mailer refactor.
2. Settings API + `/admin/settings` page.
3. Notify/confirmation API + admin action buttons.
4. Printouts.
5. Activity log + hooks.
6. Analytics API + dashboard.
7. Reports/MIS + export utility.
8. Standards: technical fixes, new pages, privacy/terms updates.
9. Verify (`astro check` + `astro build`), then commit and push.
