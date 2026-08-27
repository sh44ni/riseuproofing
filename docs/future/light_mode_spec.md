# Light Mode — "Coastal Daylight" Implementation Plan

> **Goal**: A light mode that feels like a revolution — not a simple color inversion. The dark "deep ocean" theme gets a sun-drenched counterpart that evokes San Diego's coastal daylight, with crisp whites, warm shadows, and tinted-glass effects.

---

## Design Philosophy

The current dark theme uses **glassmorphism on dark navy** — translucent panels over a deep `#0B1B2B` canvas. A naive light mode (white bg + dark text) would look flat and generic.

Instead, **Coastal Daylight** uses:
- **Warm off-white canvas** (`#F8FAFB`) — not pure white, which is too harsh
- **Blue-tinted glass** — translucent panels with a subtle blue tint (like looking through coastal fog) instead of transparent white
- **Crisp elevation shadows** — dark mode uses inner glows for depth; light mode uses real box-shadows with soft blue-gray tones
- **Navy text hierarchy** — `#112D49` for headings, `#3B5068` for body, `#64748B` for muted — 3 distinct tiers, no ambiguity
- **The hero stays dark** — the cinematic hero with the background photo is mode-independent; it keeps its dark glassmorphism. This creates a dramatic contrast at the page fold.

> [!IMPORTANT]
> **Hierarchy preservation rule**: Every text element must have ≥4.5:1 contrast ratio against its background. Every card must have ≥2 levels of visual elevation above its section background. Every CTA must be the most visually prominent element on screen.

---

## Architecture: CSS Custom Properties + Toggle

### Strategy: `data-theme` attribute on `<html>`

```
<html data-theme="dark" class="dark">   → dark mode
<html data-theme="light">               → light mode (no "dark" class)
```

**Why not just `prefers-color-scheme`?** We want both:
1. **Automatic**: Respect OS preference on first visit
2. **Manual toggle**: User can override via a sun/moon button in the navbar
3. **Persistence**: Save preference in `localStorage`

### New file: `lib/theme.ts`
A tiny theme provider that:
- Reads `localStorage` for saved preference
- Falls back to `window.matchMedia('(prefers-color-scheme: dark)')`
- Applies `data-theme` and `class="dark"` to `<html>`
- Exposes `useTheme()` hook with `{ theme, toggle }`

### New file: `components/layout/ThemeToggle.tsx`
A sun/moon animated toggle button placed in the Header navbar.

---

## Color Token System

All hardcoded colors become semantic CSS variables. The `@theme` block defines the dark palette (current), and `:root` overrides for light:

### Token Map

| Token | Dark Value | Light Value | Usage |
|-------|-----------|-------------|-------|
| `--surface-base` | `#0B1B2B` | `#F8FAFB` | Page background |
| `--surface-raised` | `#112D49` | `#FFFFFF` | Cards, panels |
| `--surface-sunken` | `#07131F` | `#EFF3F6` | Alternate sections |
| `--surface-overlay` | `rgba(11,27,43,0.65)` | `rgba(255,255,255,0.75)` | Glass panels |
| `--text-primary` | `#FFFFFF` | `#112D49` | Headings |
| `--text-secondary` | `rgba(255,255,255,0.80)` | `#3B5068` | Body text |
| `--text-muted` | `rgba(255,255,255,0.55)` | `#64748B` | Captions, labels |
| `--text-on-dark` | `#FFFFFF` | `#FFFFFF` | Text on dark hero/CTA |
| `--border-default` | `rgba(255,255,255,0.18)` | `rgba(17,45,73,0.10)` | Card borders |
| `--border-emphasis` | `rgba(255,255,255,0.32)` | `rgba(17,45,73,0.18)` | Hover borders |
| `--shadow-card` | `0 16px 36px rgba(0,0,0,0.4)` | `0 4px 24px rgba(17,45,73,0.08)` | Card shadows |
| `--shadow-elevated` | `0 24px 50px rgba(0,0,0,0.55)` | `0 8px 32px rgba(17,45,73,0.12)` | Hero card shadows |

### Brand colors (unchanged across modes)
- `--color-brand-blue: #2F9FE3` — Primary accent (stays the same)
- `--color-brand-gold: #EAA636` — Star ratings (stays the same)
- `--color-brand-success: #16A34A` — Stays the same
- `--color-brand-error: #DC2626` — Stays the same

> [!TIP]
> The brand blue `#2F9FE3` works on both dark and light backgrounds. On dark it reads as a bright accent; on light it reads as a confident corporate blue. No adjustment needed.

---

## Glass System — Light Mode Counterparts

Each dark glass class gets a matching light variant, applied automatically via `[data-theme="light"]`:

### `glass-nav-surface`

| Property | Dark | Light |
|----------|------|-------|
| `background` | `rgba(11,27,43,0.55)` | `rgba(255,255,255,0.80)` |
| `backdrop-filter` | `blur(24px) saturate(190%)` | `blur(20px) saturate(150%)` |
| `border` | `rgba(255,255,255,0.18)` | `rgba(17,45,73,0.08)` |
| `box-shadow` | Dark inner glow | `0 1px 3px rgba(0,0,0,0.06)` |
| **Text** | White | Navy |

### `glass-card-interactive`

| Property | Dark | Light |
|----------|------|-------|
| `background` | `rgba(11,27,43,0.60)` | `rgba(255,255,255,0.90)` |
| `backdrop-filter` | `blur(20px)` | `blur(12px)` |
| `border` | `rgba(255,255,255,0.16)` | `rgba(17,45,73,0.08)` |
| `box-shadow` | Dark elevated | `0 2px 16px rgba(17,45,73,0.06)` |
| **Hover shadow** | Deeper dark | `0 8px 32px rgba(17,45,73,0.10)` |

### `glass-chip` / `glass-pill-badge`

| Property | Dark | Light |
|----------|------|-------|
| `background` | `rgba(255,255,255,0.08)` | `rgba(47,159,227,0.06)` — subtle blue tint |
| `border` | `rgba(255,255,255,0.18)` | `rgba(47,159,227,0.15)` |
| `color` | White | `#2F9FE3` (brand blue) |

### `glass-section-dark` → `glass-section-light`

| Property | Dark | Light |
|----------|------|-------|
| `background` | Navy radial gradient | `#F8FAFB` solid (clean) |
| `color` | `#FFFFFF` | `#112D49` |

### `glass-input`

| Property | Dark | Light |
|----------|------|-------|
| `background` | `rgba(255,255,255,0.08)` | `rgba(255,255,255,1.0)` |
| `border` | `rgba(255,255,255,0.20)` | `#CBD5E1` (slate-300) |
| `color` | `#FFFFFF` | `#112D49` |
| `placeholder` | `rgba(255,255,255,0.5)` | `#94A3B8` (slate-400) |
| `focus border` | `#2F9FE3` | `#2F9FE3` (same) |

---

## Visual Hierarchy Preservation

> [!CAUTION]
> The #1 failure mode of light themes is **everything looks the same weight**. Here's how we prevent that:

### 1. Three-tier text weight system

| Tier | Dark | Light | Contrast on bg |
|------|------|-------|----------------|
| **H1-H3 Headings** | `#FFFFFF` on `#0B1B2B` = 16.3:1 | `#112D49` on `#F8FAFB` = 12.8:1 ✅ |
| **Body text** | `rgba(255,255,255,0.80)` = 12.5:1 | `#3B5068` on `#F8FAFB` = 7.2:1 ✅ |
| **Muted/captions** | `rgba(255,255,255,0.55)` = 7.8:1 | `#64748B` on `#F8FAFB` = 4.6:1 ✅ |

All pass WCAG AA (4.5:1 for normal text).

### 2. Card elevation scale

```
Section bg (#F8FAFB)
  └─ Card surface (#FFFFFF) + shadow + border    ← Level 1
       └─ Inner element (icon bg, chip)           ← Level 2
            └─ CTA button (brand-blue fill)       ← Level 3 (highest)
```

### 3. CTA dominance
- Primary CTA: `bg-brand-blue text-white` — **same in both modes** (brand blue is already high-contrast)
- Secondary CTA: Dark mode uses `bg-white/10 border-white/15`; Light mode uses `bg-brand-navy text-white` — **inverts to navy** for equal punch

---

## Component-by-Component Changes

### Section Group: Always-Dark (no changes needed)

These sections stay dark in both modes — they're "cinematic" and use the hero background or deep navy gradients:

| Component | Reason |
|-----------|--------|
| `Hero.tsx` | Photo background + overlay — always dark |
| `InteractiveHeroEstimator.tsx` | Inside the hero — always dark |
| `FinalCTA.tsx` | Full-bleed dark CTA section — stays dark for contrast |
| `StickyCTA.tsx` | Mobile bottom bar — stays dark for visibility |

### Section Group: Theme-Adaptive (changes needed)

| Component | Key Changes |
|-----------|-------------|
| **`Header.tsx`** | Swap `bg-[#0B1B2B]/90` → `var(--surface-overlay)`, `text-white` → `text-[var(--text-primary)]`, logo src swap, add `ThemeToggle` |
| **`MobileNav.tsx`** | Background from dark navy → white, all text colors flip, logo swap |
| **`Footer.tsx`** | `glass-section-dark` → theme-adaptive, `text-white` → semantic tokens |
| **`TrustBar.tsx`** | Dark bg → theme section bg |
| **`TrustCards.tsx`** | `glass-card-interactive` auto-adapts via CSS, `text-white` → semantic |
| **`ServicesOverview.tsx`** | Section + cards adapt |
| **`WhyRiseUp.tsx`** | Section + stat cards adapt |
| **`FeaturedProjects.tsx`** | Section + project cards adapt |
| **`ReviewsStrip.tsx`** | Section + review cards adapt |
| **`Certifications.tsx`** | Section + cert cards adapt |
| **`CareersTeaser.tsx`** | Section + teaser card adapt |
| **`SectionHeading.tsx`** | Already has `dark` prop — wire to theme context |
| **`Container.tsx` / `Section`** | Already has `dark` prop — wire to theme context |

### App-Level Changes

| File | Change |
|------|--------|
| `layout.tsx` | Add `ThemeProvider`, set initial `data-theme` via inline script (prevents flash) |
| `globals.css` | Add `[data-theme="light"]` overrides for all glass classes + semantic tokens |

---

## New Files

### `lib/theme.ts`
```
ThemeProvider (React context)
useTheme() hook → { theme: 'dark'|'light', toggle: () => void }
getInitialTheme() — reads localStorage → falls back to prefers-color-scheme
Inline <script> in layout.tsx to set data-theme before first paint (no flash)
```

### `components/layout/ThemeToggle.tsx`
```
Animated sun ↔ moon toggle button
Placed in Header navbar between nav links and phone CTA
Small, subtle — uses brand-blue accent on hover
Aria-label: "Switch to light/dark mode"
```

---

## Open Questions

> [!IMPORTANT]
> **Q1: Should the Footer stay dark in light mode?**
> Many premium sites keep a dark footer even in light mode for visual grounding. This gives a strong "bookend" effect (dark hero → light content → dark footer). Alternatively, it can be light with a navy accent strip.

> [!IMPORTANT]
> **Q2: Should the toggle respect OS preference by default, or default to dark?**
> Option A: Follow OS preference (most users on light OS get light mode immediately).
> Option B: Default to dark (current design is the "hero" experience), toggle to light.

> [!IMPORTANT]
> **Q3: Dropdown menus (mega-menu, areas dropdown) — dark or adaptive?**
> Dark glassmorphism dropdowns look premium even in light mode (like macOS right-click menus). Alternatively, they can be light glass to match the theme fully.

---

## Verification Plan

### Automated
- Build passes: `npm run build` with no errors
- All pages render in both modes without hydration mismatches

### Manual
- Check every section in both modes at 1440px, 768px, 375px widths
- Verify no text falls below WCAG AA contrast (4.5:1)
- Verify card elevation is clear (cards visually "float" above section bg)
- Verify CTAs are the most prominent elements in every section
- Verify the dark→light transition on the hero fold looks intentional, not broken
- Verify toggle persists across page navigations and hard refreshes

### Estimated Effort
~4-6 hours across 21 files modified + 2 new files created.
