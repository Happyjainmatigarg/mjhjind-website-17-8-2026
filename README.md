# Meenakshi Jain Hospital — Official Website

The public website for **Meenakshi Jain Hospital**, Circular Road, Near Bus Stand, Jind, Haryana 126102 — built with **Astro 5** + **Tailwind CSS**, featuring a built-in admin content-management backend and appointment booking with a printable receipt.

> Live site domains: `https://mjhospital.in` / `https://mj.hospital`

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start (Development)](#quick-start-development)
- [Build & Preview](#build--preview)
- [Project Structure](#project-structure)
- [Content Management (Admin Panel)](#content-management-admin-panel)
- [Data & Persistence](#data--persistence)
- [Public API Routes](#public-api-routes)
- [Deployment (Production)](#deployment-production)
- [Environment Variables](#environment-variables)
- [Security Notes](#security-notes)
- [Pages & Routes](#pages--routes)
- [Content Editing Reference](#content-editing-reference)

---

## Features

- **10+ public pages**: Home, About, Doctors, Departments/Services, Health Camps, Blog, FAQ, Gallery, Book Appointment, Contact, Emergency, Legal pages (Privacy/Terms/Disclaimer).
- **Appointment booking** with validation, an auto-generated booking ID (e.g. `MJ-F9LX-R4R2`), and a **printable receipt**.
- **Health camp registrations**, **contact form**, and **newsletter subscription** (all stored in the admin panel).
- **Built-in admin panel** (`/admin`) — edit every doctor, blog post, health camp, service, FAQ, gallery item, testimonial, and view/manage appointments & form submissions.
- **Dynamic content**: all content is stored in a JSON store and served server-side, so edits made in the admin panel appear on the site immediately (no rebuild needed).
- **SEO**: per-page meta tags, Open Graph, JSON-LD, generated `sitemap.xml`, `robots.txt`, favicons, and a custom 404 page.
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
| Auth       | scrypt password hash + Bearer session tokens  |
| Hosting    | Any Node.js server (see [Deployment](#deployment-production)) |

---

## Quick Start (Development)

Requirements: **Node.js 18+** and npm.

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

The server listens on all interfaces and supports the `*.monkeycode-ai.live` host for preview environments.

---

## Project Structure

```
website/
├── public/                  # Static assets (favicons, robots.txt, og-image, site.webmanifest)
├── data/                    # Runtime data (auto-created, GITIGNORED)
│   ├── store.json           #   All content + form submissions (seedable)
│   ├── admin.json           #   Admin username + password hash (auto-created)
│   └── admin-sessions.json  #   Active admin sessions (auto-created)
├── src/
│   ├── components/          # Reusable UI components (cards, forms, search, home sections)
│   ├── layouts/             # Layout.astro (public), AdminLayout.astro, LegalLayout.astro
│   ├── lib/
│   │   ├── admin/config.ts  #   Admin panel field schemas for every collection
│   │   ├── server/admin.ts  #   Admin auth (login, sessions, scrypt hashing)
│   │   ├── server/store.ts  #   JSON store: read/write/CRUD + seed logic
│   │   ├── theme.ts         #   Dark/light theme
│   │   ├── toast.ts         #   Toast notifications
│   │   └── utils.ts         #   slugify + helpers
│   ├── data/                # Seed data (default content, bundled at build)
│   │   ├── doctors.ts       #   8 doctors
│   │   ├── blog.ts          #   9 blog posts
│   │   ├── camps.ts         #   6 health camps
│   │   ├── services.ts      #   12 services/departments
│   │   ├── faqs.ts          #   21 FAQs
│   │   ├── gallery.ts       #   16 gallery items
│   │   └── testimonials.ts  #   8 testimonials
│   └── pages/
│       ├── index.astro      # Home
│       ├── about.astro      # About + milestones timeline
│       ├── doctors.astro    # All doctors
│       ├── doctors/[slug].astro
│       ├── services.astro   # All departments
│       ├── services/[slug].astro
│       ├── camps.astro      # All health camps
│       ├── camps/[slug].astro
│       ├── blog.astro       # All blog posts
│       ├── blog/[slug].astro
│       ├── faq.astro        # FAQ page
│       ├── gallery.astro    # Gallery
│       ├── book.astro       # Book appointment (+ print receipt)
│       ├── contact.astro    # Contact form
│       ├── emergency.astro  # Emergency info
│       ├── privacy.astro / terms.astro / disclaimer.astro / 404.astro
│       ├── admin/[...collection].astro   # Admin panel UI (SPA-style)
│       ├── sitemap.xml.ts    # Dynamic sitemap (API route)
│       └── api/             # API routes (see below)
├── astro.config.mjs         # Astro config (node adapter, allowed hosts)
├── tailwind.config.mjs
├── tsconfig.json
├── .env.example             # Admin credential template
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

### How admin edits reach the live site

Content pages render from `data/store.json` at request time (server-side rendering, `prerender = false`). When you save a change in the admin panel, the JSON store is updated immediately — refresh the public page to see the change. **No rebuild or redeploy is required.**

---

## Data & Persistence

All data lives in `data/` (auto-created on first run):

- **`data/store.json`** — the single source of truth. Contains `doctors`, `blogPosts`, `camps`, `services`, `faqs`, `gallery`, `testimonials`, `appointments`, `campRegistrations`, `contacts`, `newsletter`.
- On **first run**, the store is seeded from `src/data/*.ts` (the bundled defaults listed above).
- The `data/` directory is **gitignored**, so runtime content (appointments, admin changes) is never committed to the repository.
- **Persistence across restarts:** keep `data/` mounted on persistent disk in production (see deployment). It is a plain JSON file — back it up with normal file backups.

> Deployment note: In serverless/stateless hosting, the JSON store is not persistent. For a multi-instance or serverless setup, switch the store to a database (see [Security & Scale Notes](#security-notes)).

---

## Public API Routes

| Method | Route              | Purpose                                   | Auth  |
|--------|--------------------|-------------------------------------------|-------|
| POST   | `/api/appointments`| Create an appointment booking             | None  |
| POST   | `/api/camps`       | Register for a health camp                | None  |
| POST   | `/api/contact`     | Submit a contact message                  | None  |
| POST   | `/api/newsletter`  | Subscribe an email address                | None  |
| GET    | `/api/health`      | Health check                              | None  |
| GET    | `/api/admin/stats` | Dashboard counts for all collections      | Bearer |
| POST   | `/api/admin/login` | Log in, returns a Bearer token            | None  |
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

## Deployment (Production)

The site builds to a **Node.js standalone server** (`@astrojs/node`, `mode: 'standalone'`). Everything — public pages, admin panel, and API — runs from a single Node process.

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

The public pages can be exported as static HTML, but the **admin panel and all forms/APIs will not work** on a purely static host (Netlify Pages, GitHub Pages, S3). For those features you need the Node runtime in Option 1 or 2.

### Deployment checklist

1. Set `ADMIN_USERNAME` and a strong `ADMIN_PASSWORD` (or delete `data/admin.json` after setting them).
2. Set `site` in `astro.config.mjs` to your production URL (defaults to `https://mjhospital.in`).
3. Verify `/sitemap.xml` and `/robots.txt` render.
4. Persist the `data/` directory (mounted volume or persistent disk).
5. Test the admin login at `https://your-domain/admin`, then book a test appointment and check it appears in the admin panel.

---

## Environment Variables

| Variable         | Required | Default       | Description |
|------------------|----------|---------------|-------------|
| `ADMIN_USERNAME` | No       | `admin`       | Admin panel username |
| `ADMIN_PASSWORD` | **Yes for production** | `mjadmin2024` | Admin panel password. **Change this before going live.** |
| `HOST`           | No       | `0.0.0.0`     | Server bind host |
| `PORT`           | No       | `4321`        | Server port |

Copy `.env.example` to `.env` to configure locally. On a host platform, use its built-in environment settings.

---

## Security Notes

- **Change the default admin password** before production — the default `mjadmin2024` is public knowledge.
- Passwords are stored as **scrypt hashes** with a random salt (`data/admin.json`) — never in plain text.
- Admin API calls require a **Bearer token** (issued at login, 7-day expiry, stored in `data/admin-sessions.json`).
- Astro's CSRF protection blocks cross-site form submissions on all non-GET routes.
- The `data/` directory (credentials, sessions, patient submissions) is **gitignored** and must never be committed.
- The admin panel is served on the same origin as the public site. For higher security, put the site behind HTTPS and optionally restrict `/admin` at your reverse proxy / firewall.
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
| `/privacy`, `/terms`, `/disclaimer` | Legal pages |
| `/admin`           | Admin panel (login)   |
| `/404`             | Not-found page        |
| `/sitemap.xml`     | Generated sitemap     |

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

© Meenakshi Jain Hospital, Jind. Emergency: `01741-244000` · Ambulance: `102` · Appointment: `01741-244002`.
