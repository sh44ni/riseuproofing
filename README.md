<div align="center">

<img src="public/logo.svg" alt="Rise Up Roofing Logo" width="80" />

# Rise Up Roofing & Construction

**Production-grade Next.js website for Rise Up Roofing & Construction Inc.**  
*San Diego County's premier roofing & construction contractor.*

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-Private-red)](#)

</div>

---

## Overview

Full-stack marketing website built for Rise Up Roofing & Construction Inc. — a licensed San Diego County roofing contractor with 25+ years of experience. The site is engineered for performance, SEO, and conversion with a premium dual-theme (dark/light) design system.

**Live:** [`riseuproofing.vercel.app`](https://riseuproofing.vercel.app)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 (strict) |
| **Styling** | Tailwind CSS v4 + custom CSS design tokens |
| **UI** | Lucide React icons, custom glassmorphism system |
| **Maps** | Leaflet.js (interactive project map) |
| **Images** | Next.js `<Image>` with Unsplash + base44 CDN |
| **SEO** | Structured metadata per route, sitemap, robots.txt |
| **Deploy** | Vercel (standalone output, edge-optimized) |

---

## Project Structure

```
rise-up-next/
├── app/                    # Next.js App Router
│   ├── globals.css         # Design system tokens & global styles
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Homepage
│   ├── services/[slug]/    # Dynamic service pages
│   ├── projects/[slug]/    # Dynamic project case studies
│   ├── service-area/[city]/# 30+ city landing pages (SSG)
│   ├── about/              # About page
│   ├── careers/[slug]/     # Careers + job detail pages
│   ├── reviews/            # Reviews aggregation page
│   ├── contact/            # Contact & estimate form
│   ├── sitemap.xml/        # Dynamic XML sitemap
│   └── robots.txt/         # Robots.txt route
│
├── components/
│   ├── home/               # Homepage section components
│   │   ├── Hero.tsx        # Full-screen video hero
│   │   ├── ServicesOverview.tsx
│   │   ├── WhyRiseUp.tsx   # Stats bento grid
│   │   ├── Certifications.tsx
│   │   ├── ReviewsStrip.tsx
│   │   ├── FeaturedProjects.tsx
│   │   ├── ProjectsMap.tsx # Interactive Leaflet map
│   │   └── FinalCTA.tsx
│   ├── layout/             # Navbar, Footer, ThemeToggle
│   └── shared/             # Reusable: Container, SectionHeading, Tooltip
│
├── lib/
│   ├── data/               # Static data (services, projects, reviews)
│   ├── seo/                # Per-page metadata generators
│   ├── schema/             # JSON-LD structured data
│   ├── theme.tsx           # Theme context & provider
│   ├── types.ts            # Shared type barrel
│   └── utils.ts            # cn(), constants
│
├── types/                  # TypeScript interfaces
│   ├── project.ts
│   ├── service.ts
│   ├── review.ts
│   └── job.ts
│
├── public/
│   ├── badges/             # Certification & partner logos
│   ├── videos/             # Hero background video
│   ├── logo.svg
│   └── favicon.svg
│
└── next.config.ts          # Next.js config (standalone, turbopack)
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.17
- **npm** ≥ 9

### Local Development

```bash
# 1. Clone the repo
git clone https://github.com/sh44ni/riseuproofing.git
cd riseuproofing

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create optimized production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint |

---

## Design System

The site uses a fully custom CSS design token system defined in [`app/globals.css`](app/globals.css).

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--color-brand-navy` | `#112D49` | Primary brand navy |
| `--color-brand-blue` | `#2F9FE3` | Interactive blue |
| `--color-brand-gold` | `#EAA636` | Accent / trust |
| `--color-brand-terracotta` | `#C85A2A` | Warmth accent |

### Theming

The site supports **dark** (default) and **light** modes via `data-theme` attribute on `<html>`. All semantic tokens (`--surface-base`, `--text-primary`, etc.) flip automatically.

```css
/* Dark (default) */
:root { --surface-base: #07131F; --text-primary: #FFFFFF; }

/* Light */
[data-theme="light"] { --surface-base: #F4F8FD; --text-primary: #0B1E33; }
```

Sections marked `.always-dark` (Hero, Footer) remain dark regardless of theme.

---

## SEO Architecture

- **Structured metadata** generated per-route via `lib/seo/metadata.ts`
- **JSON-LD** schema (LocalBusiness, Service, BreadcrumbList) via `lib/schema/`
- **Dynamic XML sitemap** at `/sitemap.xml`
- **30+ city pages** pre-rendered at build time for local SEO
- **robots.txt** configured for full crawl

---

## Deployment

This project is configured for **zero-config Vercel deployment**.

```bash
# Deploy to production via Vercel CLI
npx vercel --prod
```

Or connect the GitHub repo to Vercel and set:
- **Root Directory:** `./` (repo root is the Next.js app)
- **Framework Preset:** Next.js (auto-detected)
- **No environment variables required**

Build output uses `standalone` mode for optimal cold-start performance.

---

## License

Private — All rights reserved © 2026 Rise Up Roofing & Construction Inc.
