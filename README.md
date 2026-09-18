# Meenakshi Jain Hospital — Official Website

The public website for **Meenakshi Jain Hospital**, Circular Road, Near Bus Stand, Jind, Haryana 126102 — built with **Astro 5** + **Tailwind CSS**, featuring a built-in admin panel that manages content, appointments, email delivery, site/contact details, media, insurance (TPA) partners, payment settings, an activity audit log, analytics and reports/MIS.

> Live site domains: `https://mjhospital.in` / `https://mj.hospital`
>
> Compliance: DPDP Act 2023 privacy, NABH-oriented patient information, MoHFW patient-rights charter, Telemedicine Practice Guidelines 2020, WCAG 2.1 AA / IS 17802 accessibility.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start (Development)](#quick-start-development)
- [Build & Preview](#build--preview)
- [Project Structure](#project-structure)
- [Content Management (Admin Panel)](#content-management-admin-panel)
- [Reports, Analytics & Exports](#reports-analytics--exports)
- [Data & Persistence](#data--persistence)
- [Public API Routes](#public-api-routes)
- [Email Notifications](#email-notifications)
- [Deployment (Production)](#deployment-production)
- [Environment Variables](#environment-variables)
- [Security & Standards](#security--standards)
- [Pages & Routes](#pages--routes)
- [Content Editing Reference](#content-editing-reference)

---

## Features

- **25+ public pages**: Home, About, Doctors, Departments/Services, Health Camps, Blog, FAQ, Gallery, Book Appointment, Contact, Emergency, plus legal and patient-information pages (Privacy, Terms, Disclaimer, Refund & Cancellation, Patient Rights, Patient Guide, Grievance Redressal, Insurance & TPA, Telemedicine, Accessibility, Hospital Information).
- **Appointment booking** with validation, an auto-generated booking ID (e.g. `MJ-F9LX-R4R2`), a **printable receipt**, and an optional online-payment step.
- **Email notifications** on appointment, camp, contact and newsletter events — to patients, matched doctors and admins. Delivered through a provider API (Resend / SendGrid / Brevo) or SMTP (e.g. Gmail), configurable from the admin panel.
- **Health camp registrations**, **contact form**, and **newsletter subscription** (all stored in the admin panel).
- **Built-in admin panel** (`/admin`) — edit every doctor, blog post, health camp, service, FAQ, gallery item and testimonial; manage appointments and form submissions; and configure email, site/contact details, social links, media, insurance (TPA) partners and payments.
- **Site & contact CMS** — contact email, phone numbers, address, OPD hours and social links are stored in the admin and hydrated on the public site at load time.
- **Media library** — upload images, copy their URLs, hide them from the site, or delete them.
- **Insurance & TPA manager** — maintain cashless insurers/TPAs with helpline numbers and logos; the list renders on the public `/insurance` page.
- **Reports & MIS** — appointment/revenue summaries, department mix and form-submission counts, exportable to **CSV, Excel (`.xls`), Word (`.doc`), PDF (browser print) and JSON**.
- **Analytics dashboard** — request volume, trends over time and department mix at a glance.
- **Activity log** — audit trail of admin sign-ins and record changes.
- **Dynamic content**: all content is stored in a JSON store and served server-side, so edits made in the admin panel appear on the site immediately (no rebuild needed).
- **SEO & PWA**: per-page meta tags, Open Graph, JSON-LD (`WebSite` + `Hospital` graph with `SearchAction`), generated `sitemap.xml`, RSS feed (`/rss.xml`), `robots.txt`, web manifest, favicons, and a custom 404 page.
- **Security**: security response headers (`public/_headers`), CSRF protection, scrypt password hashing, signed sessions, and AES-GCM encryption for stored API keys/passwords.
- **Performance**: inline stylesheets, static + on-demand rendering, responsive/mobile-first design.
- **Accessibility & UX**: dark/light theme toggle, search overlay, floating emergency actions, animated hero.

---

## Tech Stack

| Layer      | Technology                                   |
|------------|----------------------------------------------|
| Framework  | Astro 5 (`@astrojs/node`, standalone mode)   |
| Styling    | Tailwind CSS 3 (`@astrojs/tailwind`)         |
| Language   | TypeScript                                   |
| Data store | JSON file (`data/store.json`) — zero database |
| Auth       | scrypt password hash + HMAC-signed session tokens |
| Secrets    | AES-GCM encrypted at rest (`ADMIN_SETTINGS_SECRET`) |
| Email      | Provider HTTP API (Resend / SendGrid / Brevo) or SMTP via Nodemailer (optional) |
| Hosting    | **Node.js server** (see [Deployment](#deployment-production)) |


---

## Quick Start (Development)

Requirements: **Node.js 20.16+** (Node 22 LTS recommended) and npm.

> Node 20.16+ is required for the synchronous `process.getBuiltinModule('node:fs')` accessor the JSON store uses to persist `data/store.json`. On older runtimes the store silently falls back to in-memory (non-persistent).

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Set admin credentials before first run
cp .env.example .env
#   Edit .env — defaults are username "admin" / password "mjadmin2024"

# 3. Start the dev server
npm run dev
# Dev server at http://localhost:4321
```

Open `http://localhost:4321` in your browser. The admin panel is at `http://localhost:4321/admin`.

---

## Build & Preview

```bash
# Production build (outputs to dist/)
npm run build

# Preview the production build locally
npm run preview
# Serves on http://localhost:4321 (hosts on 0.0.0.0 in a container)
```

The server listens on all interfaces.

---

## Project Structure

```
website/
├── public/                  # Static assets (favicons, robots.txt, og-image, site.webmanifest, _headers)
├── data/                    # Runtime data (auto-created, GITIGNORED)
│   ├── store.json           #   All content + settings + submissions (seedable)
│   ├── admin.json           #   Admin username + password hash (auto-created)
│   └── admin-sessions.json  #   Active admin sessions (auto-created)
├── src/
│   ├── components/          # Reusable UI components (cards, forms, search, home sections, SEO)
│   ├── layouts/             # Layout.astro (public), AdminLayout.astro, LegalLayout.astro
│   ├── lib/
│   │   ├── admin/config.ts  #   Admin collection + page schemas
│   │   ├── export.ts        #   CSV / Excel / Word / PDF / JSON export helpers
│   │   ├── server/
│   │   │   ├── store.ts        # JSON store: read/write/CRUD + seed logic
│   │   │   ├── settings.ts     # Email/site/payment settings resolution + masking
│   │   │   ├── crypto-box.ts   # AES-GCM encryption for stored secrets
│   │   │   ├── mailer.ts       # API + SMTP transport (Resend/SendGrid/Brevo/Gmail)
│   │   │   ├── notifications.ts# Event → email composition
│   │   │   ├── base64.ts       # Worker-safe base64 helpers
│   │   │   └── admin.ts        # Admin auth (login, sessions, scrypt hashing)
│   │   ├── theme.ts         #   Dark/light theme
│   │   ├── toast.ts         #   Toast notifications
│   │   └── utils.ts         #   slugify + helpers
│   ├── scripts/
│   │   ├── admin.ts         #   Admin SPA (dashboard, collections, settings, reports…)
│   │   ├── admin/shared.ts  #   Shared admin client helpers
│   │   ├── site-settings.ts #   Public contact/hours/social hydration from /api/site
│   │   └── tpa-list.ts      #   Public insurance/TPA list rendering
│   ├── data/                # Seed data (default content, bundled at build)
│   │   ├── doctors.ts       #   8 doctors
│   │   ├── blog.ts          #   9 blog posts
│   │   ├── camps.ts         #   6 health camps
│   │   ├── services.ts      #   12 services/departments
│   │   ├── faqs.ts          #   21 FAQs
│   │   ├── gallery.ts       #   16 gallery items
│   │   ├── testimonials.ts  #   8 testimonials
│   │   └── site.ts          #   Contact, hours, social, emergency numbers
│   └── pages/
│       ├── index.astro      # Home
│       ├── about.astro      # About + milestones timeline
│       ├── doctors.astro / doctors/[slug].astro
│       ├── services.astro / services/[slug].astro
│       ├── camps.astro / camps/[slug].astro
│       ├── blog.astro / blog/[slug].astro
│       ├── faq.astro, gallery.astro, book.astro, contact.astro, emergency.astro
│       ├── privacy.astro, terms.astro, disclaimer.astro, 404.astro
│       ├── patient-rights.astro, patient-guide.astro, grievance.astro
│       ├── refund-cancellation.astro, insurance.astro, telemedicine.astro
│       ├── accessibility.astro, hospital-information.astro
│       ├── admin/[...collection].astro    # Admin panel UI (SPA-style)
│       ├── sitemap.xml.ts    # Dynamic sitemap (API route)
│       ├── rss.xml.ts        # Blog RSS feed (API route)
│       └── api/              # API routes (see below)
├── astro.config.mjs         # Astro config (node adapter, allowed hosts)
├── tailwind.config.mjs
├── tsconfig.json
├── .env.example             # Admin + email credential template
├── .gitignore               # Excludes node_modules, dist, data/, .env, .astro/
└── package.json
```

---

## Content Management (Admin Panel)

### Where is the admin login?

The admin panel lives at:

```
https://<your-domain>/admin
```

There is **no visible login link in the public site navigation** by design — go directly to the `/admin` URL.

### Default credentials

| Field    | Default value    |
|----------|------------------|
| Username | `admin`          |
| Password | `mjadmin2024`    |

> **IMPORTANT:** Change these before going live by setting `ADMIN_USERNAME` / `ADMIN_PASSWORD` environment variables (or deleting `data/admin.json` after setting them). See [Environment Variables](#environment-variables).

### What can you manage?

| Collection        | You can… |
|-------------------|----------|
| **Appointments**  | View bookings, search, change status (`pending → confirmed / completed / cancelled`) |
| **Camp Registrations** | View & edit camp signups |
| **Contacts**      | Read contact-form messages |
| **Newsletter**    | View subscribers (read-only) |
| **Doctors**       | Add/edit/delete doctor profiles (name, specialty, department, qualifications, languages, availability hours, OPD fee, featured flag, highlights, education) |
| **Blog Posts**    | Write/edit articles with rich blocks (headings, bullets, numbered lists, quotes) |
| **Health Camps**  | Manage camps (date, location, services, capacity, status upcoming/past) |
| **Services**      | Manage departments & services (features, conditions, procedures, why-choose) |
| **FAQs**          | Add/edit questions & answers by category |
| **Gallery**       | Manage gallery images & captions |
| **Testimonials**  | Manage patient reviews & ratings |

Every content collection supports **search**, **create**, **edit**, and **delete**. Forms collections (appointments, camp registrations, contacts) allow editing and status changes where relevant.

### Admin modules

In addition to the content collections, the admin sidebar includes:

| Module | Group | What it does |
|--------|-------|--------------|
| **Analytics** | Insights | Request volume, trends over time and department mix |
| **Reports & MIS** | Insights | Operational reports with CSV / Excel / Word / PDF / JSON export |
| **Email & Notifications** | Settings | Choose transport (API / SMTP / automatic), provider, sender, recipients; send a test email |
| **Site & Contact** | Settings | Edit contact email, phone numbers, address, OPD hours and social links (Facebook, Instagram, LinkedIn, X, WhatsApp) with enable/disable |
| **Media Library** | Settings | Upload images, copy URL, hide from site, delete |
| **Insurance & TPA** | Settings | Manage cashless insurers/TPAs (name, helpline, logo, active flag) |
| **Payments** | Settings | Optional online payment gateway (key id / secret encrypted, UPI, instructions, test/live mode) |
| **Activity Log** | System | Audit trail of admin sign-ins and record changes |

### How admin edits reach the live site

Content pages render from `data/store.json` at request time (server-side rendering, `prerender = false`). When you save a change in the admin panel, the JSON store is updated immediately — refresh the public page to see it. No rebuild or redeploy is required for content changes.

---

## Reports, Analytics & Exports

The admin panel ships dependency-free reporting:

- **Analytics** (`/admin/analytics`) — total requests, appointments by status, new submissions in the selected period, a trend sparkline and a department mix breakdown.
- **Reports & MIS** (`/admin/reports`) — table-based operational reports (appointments, camp registrations, contacts, newsletter, department summary) with a date-range filter.
- **Exports** — every report can be exported from the browser:
  - **CSV** (`.csv`) and **JSON** (`.json`) for spreadsheets/APIs,
  - **Excel** (`.xls`, SpreadsheetML) and **Word** (`.doc`, HTML) for offline documents,
  - **PDF** via the browser print dialog (opens a print-ready window).

Exports respect the active filter, so the downloaded file matches what is on screen.

---

## Data & Persistence

All data lives in `data/` (auto-created on first run):

- **`data/store.json`** — the single source of truth. Contains `doctors`, `blogPosts`, `camps`, `services`, `faqs`, `gallery`, `testimonials`, `appointments`, `campRegistrations`, `contacts`, `newsletter`, plus `settings` (email/site/payment), `tpas` (insurance partners), `media` (uploaded images) and `activity` (audit log).
- On **first run**, the store is seeded from `src/data/*.ts` (the bundled defaults listed above).
- The `data/` directory is **gitignored**, so runtime content (appointments, admin changes) is never committed to the repository.
- **Persistence across restarts:** keep `data/` mounted on persistent disk in production (see deployment). It is a plain JSON file — back it up with normal file backups.
- **Deployment note:** In serverless/stateless hosting, the JSON store is not persistent. For a multi-instance or serverless setup, switch the store to a database (see [Security & Standards](#security--standards)).

---

## Public API Routes

| Method | Route              | Purpose                                   | Auth  |
|--------|--------------------|-------------------------------------------|-------|
| POST   | `/api/appointments`| Create an appointment booking             | None  |
| POST   | `/api/camps`       | Register for a health camp                | None  |
| POST   | `/api/contact`     | Submit a contact message                  | None  |
| POST   | `/api/newsletter`  | Subscribe an email address                | None  |
| GET    | `/api/health`      | Health check                              | None  |
| GET    | `/api/site`        | Public site settings (contact, hours, social, active TPAs) — 60s cache | None |
| GET    | `/api/media/[id]`  | Serve an uploaded image (immutable cache) | None  |
| POST   | `/api/admin/login` | Log in, returns a Bearer token            | None  |
| GET    | `/api/admin/stats` | Dashboard counts for all collections      | Bearer |
| GET    | `/api/admin/analytics` | Aggregated analytics for the dashboard | Bearer |
| GET    | `/api/admin/activity`  | Admin activity log                     | Bearer |
| GET/PUT | `/api/admin/settings` | Read/update email settings            | Bearer |
| POST   | `/api/admin/settings/test` | Send a test email                | Bearer |
| GET/PUT | `/api/admin/site-settings` | Read/update site, contact & social settings | Bearer |
| GET/PUT | `/api/admin/payment` | Read/update payment gateway settings  | Bearer |
| GET/POST | `/api/admin/tpas`  | List / create insurance (TPA) partners | Bearer |
| GET/PUT/DELETE | `/api/admin/tpas/[id]` | Read / update / delete a TPA   | Bearer |
| GET/POST | `/api/admin/media`  | List / upload media files             | Bearer |
| GET/PUT/DELETE | `/api/admin/media/[id]` | Read (metadata) / update (show-hide) / delete an image | Bearer |
| POST   | `/api/admin/notify` | Trigger a notification email           | Bearer |
| GET    | `/api/admin/[collection]` | List items                        | Bearer |
| POST   | `/api/admin/[collection]` | Create an item                    | Bearer |
| GET    | `/api/admin/[collection]/[id]` | Get one item               | Bearer |
| PUT    | `/api/admin/[collection]/[id]` | Update an item             | Bearer |
| DELETE | `/api/admin/[collection]/[id]` | Delete an item             | Bearer |

Admin collections: `appointments`, `campRegistrations`, `contacts`, `newsletter`, `doctors`, `blogPosts`, `camps`, `services`, `faqs`, `gallery`, `testimonials`.

**Example admin login:**

```bash
curl -X POST https://your-domain/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"mjadmin2024"}'
```

Use the returned `token` for all other admin calls:

```bash
curl https://your-domain/api/admin/stats \
  -H "Authorization: Bearer <token>"
```

---

## Email Notifications

Delivery is configured in the admin panel under **Email & Notifications**, or via environment variables (admin settings take precedence). Two transports are supported:

| Transport | Providers | Notes |
|-----------|-----------|-------|
| **API** (HTTP, works on edge/serverless) | Resend, SendGrid, Brevo | Set the provider + API key; no outbound SMTP needed |
| **SMTP** | Gmail, any SMTP server | Set host/port/user/app-password; port 587 STARTTLS or 465 TLS |
| **Automatic** | — | Uses an API key if present, otherwise SMTP |

Stored API keys and SMTP passwords are encrypted at rest and never returned to the browser (only a `…Set` flag).

| Event | Recipients | Subject example |
|-------|-----------|-----------------|
| Appointment requested | Patient | `Appointment request received — MJ-F9LX-R4R2` |
| Appointment requested | Doctor (matched) | `New appointment request for you — MJ-F9LX-R4R2` |
| Appointment requested | Admin(s) | `New appointment request — MJ-F9LX-R4R2` |
| Appointment status changed (confirmed/completed/cancelled) | Patient | `Appointment confirmed — MJ-F9LX-R4R2` |
| Health camp registration | Patient | `Camp registration confirmed — Free Eye Camp` |
| Health camp registration | Admin(s) | `New camp registration — Free Eye Camp` |
| Contact form message | Admin(s) | `New contact message — Ramesh Kumar` |
| Newsletter subscription | Subscriber | `Welcome to Meenakshi Jain Hospital health updates` |
| Newsletter subscription | Admin(s) | `New newsletter subscriber — user@example.com` |

---

## Deployment (Production)

The site builds to a **Node.js standalone server** (`@astrojs/node`, `mode: 'standalone'`). Everything — public pages, admin panel, and API — runs from a single Node process.

> **Important:** This app is designed for a **Node.js runtime with a persistent filesystem** — it uses a JSON file store (`data/store.json`) and `node:fs`, and this is the only mode where content and submissions persist across restarts. The server code is also edge-safe (no top-level `node:` imports; mailer falls back to HTTP APIs), but on stateless runtimes such as Cloudflare Workers the store is **in-memory** and resets on every restart, so it is only suitable for demos. For production, deploy to a Node host (VPS, Railway, Render, Fly.io, DigitalOcean App Platform) and mount a persistent disk for `data/`.

### Option 1 — Node.js host (VPS, Railway, Render, Fly.io, DigitalOcean App Platform)

```bash
# 1. Install dependencies and build
npm ci
npm run build

# 2. Start the production server (entrypoint is dist/server/entry.mjs)
node dist/server/entry.mjs
```

For a public web host, add a `start` script:

```json
"start": "node dist/server/entry.mjs"
```

### Option 2 — Docker

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV HOST=0.0.0.0 PORT=4321
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
```

```bash
docker build -t mj-hospital .
docker run -p 4321:4321 -v mj_data:/app/data mj-hospital
```

**Critical:** mount the `/app/data` volume so `store.json` (appointments, admin content) persists across container restarts.

### Option 3 — Static hosting (limited)

The public pages can be exported as static HTML, but the **admin panel and all forms/APIs will not work** on a purely static host (Netlify Pages, GitHub Pages, S3). For those features you need the Node.js server deployment above.

### Deployment checklist

1. Set `ADMIN_USERNAME` and a strong `ADMIN_PASSWORD` (or delete `data/admin.json` after setting them).
2. Set `ADMIN_SESSION_SECRET` and `ADMIN_SETTINGS_SECRET` so sessions and encrypted secrets survive restarts.
3. Set `site` in `astro.config.mjs` to your production URL (defaults to `https://mjhospital.in`).
4. Configure email under **Admin → Email & Notifications** (or via `MAIL_API_KEY` / SMTP env vars) and use **Send test email**.
5. Verify `/sitemap.xml`, `/robots.txt`, `/rss.xml` and `/api/site` render.
6. Persist the `data/` directory (mounted volume or persistent disk).
7. Test the admin login at `https://your-domain/admin`, then book a test appointment and check it appears in the admin panel.

---

## Environment Variables

| Variable | Required | Default       | Description |
|----------|----------|---------------|-------------|
| `ADMIN_USERNAME` | No | `admin` | Admin panel username |
| `ADMIN_PASSWORD` | **Yes for production** | `mjadmin2024` | Admin panel password. **Change this before going live.** |
| `ADMIN_SESSION_SECRET` | Recommended | derived | Secret used to sign admin session tokens |
| `ADMIN_SETTINGS_SECRET` | Recommended | derived | Key used to encrypt stored email/payment secrets (AES-GCM). Set this so secrets survive restarts and password changes |
| `MAIL_API_KEY` | No | — | Fallback API key for the email provider (Resend/SendGrid/Brevo). Normally set in the admin panel |
| `SMTP_HOST` | No | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_SECURE` | No | `false` | Use TLS (`true` for port 465) |
| `SMTP_USER` | No | — | SMTP username (e.g. Gmail address) |
| `SMTP_PASS` | No | — | SMTP password / Gmail **App Password** (2-Step Verification → myaccount.google.com/apppasswords) |
| `MAIL_FROM` | No | `SMTP_USER` | "From" address shown on outgoing mail |
| `ADMIN_NOTIFY_EMAILS` | No | — | Comma-separated emails that receive admin notifications (appointments, camps, contacts, newsletter) |
| `SITE_URL` | No | `https://mjhospital.in` | Public site URL used for links in emails |
| `HOST` | No | `0.0.0.0` | Server bind host |
| `PORT` | No | `4321` | Server port |

Copy `.env.example` to `.env` to configure locally. On a host platform, use its built-in environment settings. Email settings can also be managed entirely from the admin panel (**Email & Notifications**).

---

## Security & Standards

- **Change the default admin password** before production — the default `mjadmin2024` is public knowledge.
- Passwords are stored as **scrypt hashes** with a random salt (`data/admin.json`) — never in plain text.
- Admin API calls require a **Bearer token** (issued at login, HMAC-signed, 7-day expiry, stored in `data/admin-sessions.json`).
- Email API keys and payment secrets are **encrypted at rest with AES-GCM** and masked in the admin API.
- Astro's CSRF protection blocks cross-site form submissions on all non-GET routes.
- **Security response headers** are defined in `public/_headers` — HSTS, Content-Security-Policy, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, `Cross-Origin-Opener-Policy`, and `no-store` on `/admin/*` and `/api/*`.
- `robots.txt` disallows `/admin`, `/api/` and `/search`.
- The `data/` directory (credentials, sessions, patient submissions) is **gitignored** and must never be committed.
- The admin panel is served on the same origin as the public site. For higher security, put the site behind HTTPS and optionally restrict `/admin` at your reverse proxy / firewall.
- **Privacy (DPDP Act 2023)**: the Privacy Policy documents data-collection purposes, retention, data-principal rights and grievance-officer contact.
- **Clinical/patient standards**: NABH-oriented hospital information, MoHFW patient-rights charter, Telemedicine Practice Guidelines 2020 (with consent notice), grievance-redressal and refund/cancellation policies.
- **Accessibility**: WCAG 2.1 AA / IS 17802-oriented markup, plus an accessibility statement page.
- For multi-instance or serverless scale, replace the JSON store with a real database (e.g. SQLite/Postgres) — the `store.ts` interface is small and can be swapped.

---

## Pages & Routes

| URL                | Page                  |
|--------------------|-----------------------|
| `/`                | Home                  |
| `/about`           | About + milestones    |
| `/doctors`         | All doctors           |
| `/doctors/:slug`   | Doctor profile        |
| `/services`        | All departments       |
| `/services/:slug`  | Department details    |
| `/camps`           | All health camps      |
| `/camps/:slug`     | Camp details          |
| `/blog`            | All blog posts        |
| `/blog/:slug`      | Blog article          |
| `/faq`             | FAQs                  |
| `/gallery`         | Gallery               |
| `/book`            | Book an appointment (with printable receipt) |
| `/contact`         | Contact form          |
| `/emergency`       | Emergency contact info|
| `/privacy`         | Privacy Policy (DPDP Act 2023) |
| `/terms`           | Terms of Service      |
| `/disclaimer`      | Medical Disclaimer    |
| `/patient-rights`  | Patient Rights charter |
| `/patient-guide`   | Patient & attendant guide |
| `/grievance`       | Grievance redressal   |
| `/refund-cancellation` | Refund & cancellation policy |
| `/insurance`       | Insurance & TPA list  |
| `/telemedicine`    | Telemedicine & consent |
| `/accessibility`   | Accessibility statement |
| `/hospital-information` | Hospital information |
| `/admin`           | Admin panel (login)   |
| `/404`             | Not-found page        |
| `/sitemap.xml`     | Generated sitemap     |
| `/rss.xml`         | Blog RSS feed         |

---

## Content Editing Reference

Content entered through the admin panel supports several field types. Details:

| Field type  | How to enter                              |
|-------------|-------------------------------------------|
| `text`      | Single line value                         |
| `textarea`  | Multi-line value                          |
| `number`    | Numeric value                             |
| `date`      | `YYYY-MM-DD` (date picker)                |
| `select`    | Choose from a predefined list             |
| `toggle`    | On/off switch (e.g. featured, available)  |
| `list`      | One item per line; blank lines separated  |
| `blocks`    | Blog content: blank line = new paragraph; `### ` = heading; `- ` = bullet; `1. ` = numbered; `> ` = quote |

---

© Meenakshi Jain Hospital, Jind. Emergency: `112` (all-in-one) · Ambulance: `108` (free) · Hospital: `8278170381`.
