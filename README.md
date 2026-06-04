# 0x7hierri Portfolio + CMS

A production-style personal portfolio built with Next.js App Router and Supabase, including a full admin CMS for editing homepage sections, about content, projects, blog posts, studies, media, navigation, SEO, and social links.

This repository contains both:

- Public-facing site pages
- Protected admin dashboard and content workflows

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Bootstrap (Supabase)](#database-bootstrap-supabase)
- [Admin Access](#admin-access)
- [Available Scripts](#available-scripts)
- [Deployment Notes](#deployment-notes)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project is designed as a real-world portfolio platform with CMS capabilities.

Public pages are rendered via the Next.js App Router, while admin updates are persisted to Supabase via server actions and route handlers.

Key operational points:

- Next.js 14 App Router architecture
- Supabase as database, auth provider, and storage backend
- Protected admin area under `/admin`
- Dynamic metadata and sitemap support
- Light/Night mode support with persisted preference

---

## Tech Stack

- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS + CSS custom properties
- Motion: Framer Motion
- Icons: Lucide React
- Database/Auth/Storage: Supabase
- Rich content: Tiptap (admin editor), React Markdown (site rendering)

---

## Core Features

### Public Site

- Homepage with dynamic hero, stats, feed, and expertise content
- About page with profile, timeline, education, and skills/focus sections
- Projects listing and detail pages
- Blog listing and markdown-powered blog post pages
- Studies categories and entry pages
- Contact page and unified navigation/footer
- SEO metadata and sitemap generation

### Admin CMS

- Supabase-authenticated admin login
- CRUD workflows for:
  - Hero/Profile/About/Footer
  - Homepage settings and expertise
  - Projects
  - Blog posts
  - Studies (categories and entries)
  - Navigation and SEO settings
  - Social links and statistics
- Media uploads through a server route (`/api/admin/upload`)

### Runtime and Ops

- Custom build directories for better stability in OneDrive environments
- Route revalidation endpoint (`/api/revalidate`)
- Markdown regression test script to guard renderer behavior

---

## Project Structure

```text
my-portfolio/
	actions/                  # Server actions for CMS writes + revalidation
	app/
		(site)/                 # Public pages
		admin/                  # Protected admin dashboard
		api/                    # Upload + revalidate route handlers
		globals.css             # Theme tokens and global styles
		layout.tsx              # Root layout + theme bootstrap
	components/
		admin/                  # Admin UI components
		site/                   # Public UI components
	lib/
		supabase/               # Browser/server/admin Supabase clients
		seo.ts                  # Metadata helpers
	scripts/
		clean-next.mjs          # Pre-dev cleanup for .next* dirs
		markdown-regression.tsx # Markdown rendering regression checks
	supabase/
		schema.sql              # Full schema bootstrap
		seed.sql                # Starter content
		fixes/                  # Chronological SQL fixes/migrations
	types/
		database.ts             # Generated/maintained DB types
```

---

## Getting Started

### 1. Prerequisites

- Node.js 18.18+ (Node 20+ recommended)
- npm
- A Supabase project

### 2. Install dependencies

```bash
npm install
```

### 3. Create local environment file

Create `.env.local` in the project root.

Use this template:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional, but recommended
NEXT_PUBLIC_SITE_NAME=0x7hierri
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Bootstrap database and content

See [Database Bootstrap (Supabase)](#database-bootstrap-supabase).

### 5. Run development server

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Environment Variables

| Variable                        | Required    | Used For                                             |
| ------------------------------- | ----------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes         | Supabase URL for browser/server clients              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes         | Public key for browser/server Supabase access        |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes         | Admin client writes, uploads, and revalidation guard |
| `NEXT_PUBLIC_SITE_NAME`         | No          | Site/metadata fallback title                         |
| `NEXT_PUBLIC_SITE_URL`          | Recommended | Canonical base for sitemap output                    |

---

## Database Bootstrap (Supabase)

Run SQL files in Supabase SQL Editor in this order:

1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. Fixes in `supabase/fixes/` (chronological order)

Current fix files:

- `supabase/fixes/2026-05-21-education-entries.sql`
- `supabase/fixes/2026-06-02-homepage-about-cms.sql`

Notes:

- The schema currently disables RLS for local/dev convenience.
- Harden policies before production if you need stricter data access boundaries.

---

## Admin Access

Admin routes are under `/admin` and require a valid Supabase session.

How to login:

1. In Supabase Dashboard, create a user in Auth (Email/Password).
2. Open `/admin/login` in the app.
3. Sign in using that account.

Authentication behavior:

- `app/admin/layout.tsx` checks session server-side.
- Unauthenticated users are redirected to `/admin/login`.

---

## Available Scripts

```bash
npm run dev            # starts Next dev server (runs predev cleanup first)
npm run build          # production build
npm run start          # serve production build
npm run lint           # run ESLint
npm run test:markdown  # markdown renderer regression checks
```

---

## Deployment Notes

For production deployment (for example, Vercel):

1. Set all required environment variables in your hosting platform.
2. Ensure Supabase project is seeded/migrated and has required storage bucket access.
3. Confirm remote image hosts in `next.config.mjs` include your media domains.
4. If using on-demand revalidation, protect `/api/revalidate` with a strong secret (currently validated against `SUPABASE_SERVICE_ROLE_KEY`).

---

## Security Notes

- `/api/admin/upload` requires an authenticated session and performs storage operations via service-role client.
- `/api/revalidate` requires a matching secret query parameter.
- Any authenticated Supabase user can currently access admin if they can sign in; for stricter control, enforce role claims or dedicated admin policy checks.

---

## Troubleshooting

### 1. Next build/dev instability in OneDrive paths

Symptoms can include intermittent `ENOENT`/trace/type artifact issues.

What this project already does:

- Uses custom dist dirs (`.next-dev` and `.next-build`) in `next.config.mjs`
- Disables output file tracing (`outputFileTracing: false`)
- Includes `.next*/types/**/*.ts` in TypeScript include paths
- Runs `scripts/clean-next.mjs` before `npm run dev`

If issues persist, manually remove `.next`, `.next-dev`, and `.next-build`, then restart dev/build.

### 2. Supabase env errors at startup

If you see missing/invalid Supabase env errors, verify:

- `NEXT_PUBLIC_SUPABASE_URL` is a full URL (including protocol)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is present
- `SUPABASE_SERVICE_ROLE_KEY` is set for server-side admin operations

### 3. Upload failures in admin

Check:

- You are logged in to admin
- Service role key is valid
- Storage permissions/bucket creation are allowed in your Supabase project

### 4. Empty pages after first run

Usually means schema/seed/fixes were not fully applied. Re-run SQL files in order.

---

## Maintainer

Built and maintained by 0x7hierri.
