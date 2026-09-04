# Rise Up Roofing CRM — UI/UX Design Specification

A mobile-first, field-ready CRM interface designed for roofing professionals who spend 80% of their time away from a desk. Every screen is built for one-thumb operation on a phone, then scales up gracefully for tablet and desktop.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Design System](#design-system)
3. [Component Library](#component-library)
4. [Navigation Architecture](#navigation-architecture)
5. [Screen Specifications](#screen-specifications)
6. [Interaction Patterns](#interaction-patterns)
7. [Animation & Motion](#animation--motion)
8. [Accessibility](#accessibility)
9. [Responsive Breakpoints](#responsive-breakpoints)
10. [Component File Structure](#component-file-structure)

---

## Design Philosophy

### Core Principles

| Principle | What it means in practice |
|---|---|
| **Field-first** | Every screen must be usable with one thumb on a phone while standing on a roof or at a front door |
| **Glanceable** | Critical info (lead count, overdue tasks, today's schedule) visible in < 2 seconds without scrolling |
| **Action-oriented** | The most common action on any screen is always 1 tap away (FAB or primary button) |
| **Zero training** | A new sales rep should navigate without instruction — familiar mobile patterns, clear labels, no jargon |
| **Dark by default** | Matches existing admin panel, reduces eye strain in bright outdoor conditions (high-contrast text on dark backgrounds is exceptionally readable in direct sunlight) |
| **Consistent with marketing site** | Same brand warmth (amber/orange accents) carried directly into the admin experience |

---

## Design System

### Color Palette

#### Core Colors
```
Background
├── bg-primary:       #0F172A  (slate-900)     — Main app background
├── bg-secondary:     #1E293B  (slate-800)     — Cards, panels, modals
├── bg-tertiary:      #334155  (slate-700)     — Hover states, active items
├── bg-elevated:      rgba(255,255,255,0.03)   — Subtle card elevation
└── bg-surface:       rgba(255,255,255,0.05)   — Interactive surfaces

Borders
├── border-subtle:    rgba(255,255,255,0.06)   — Card borders, dividers
├── border-default:   rgba(255,255,255,0.10)   — Input borders, table rows
└── border-focus:     rgba(245,158,11,0.50)    — Focus rings (amber)

Text
├── text-primary:     #FFFFFF                  — Headings, primary content
├── text-secondary:   #94A3B8  (slate-400)     — Labels, secondary info
├── text-tertiary:    #64748B  (slate-500)     — Timestamps, hints
├── text-disabled:    #475569  (slate-600)     — Disabled state
└── text-inverse:     #0F172A                  — Text on light/colored backgrounds
```

#### Accent & Status Colors
```
Brand
├── amber-400:   #FBBF24   — Primary accent, CTAs, active nav
├── amber-500:   #F59E0B   — Hover states
├── orange-500:  #F97316   — Gradient end (avatar, hero elements)

Pipeline Status (used consistently everywhere)
├── new:         #3B82F6 / blue-500      — badge bg: blue-500/20
├── contacted:   #F59E0B / amber-500     — badge bg: amber-500/20
├── inspected:   #06B6D4 / cyan-500      — badge bg: cyan-500/20
├── quoted:      #8B5CF6 / purple-500    — badge bg: purple-500/20
├── won:         #10B981 / emerald-500   — badge bg: emerald-500/20
├── lost:        #EF4444 / red-500       — badge bg: red-500/20

Priority Indicators
├── hot:         #EF4444 / red-500       — 🔴 Score 70+
├── warm:        #F59E0B / amber-500     — 🟡 Score 30-69
├── cool:        #3B82F6 / blue-500      — 🔵 Score 0-29

Semantic
├── success:     #10B981 / emerald-500
├── warning:     #F59E0B / amber-500
├── error:       #EF4444 / red-500
├── info:        #3B82F6 / blue-500
```

### Typography

```
Font Family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
(Native system font — fastest load, zero layout shift, feels native on iOS & Android)

Scale (mobile → desktop)
├── Display:    28px / 36px    font-weight: 800   line-height: 1.1   — Page titles (mobile only)
├── H1:         24px / 28px    font-weight: 700   line-height: 1.2   — Section headers
├── H2:         18px / 20px    font-weight: 600   line-height: 1.3   — Card titles
├── H3:         15px / 16px    font-weight: 600   line-height: 1.4   — Sub-sections
├── Body:       14px / 14px    font-weight: 400   line-height: 1.5   — General content
├── Body-sm:    13px / 13px    font-weight: 400   line-height: 1.5   — Table cells, secondary
├── Caption:    11px / 12px    font-weight: 500   line-height: 1.4   — Timestamps, badges, labels
├── Overline:   10px / 11px    font-weight: 600   line-height: 1.3   — UPPERCASE labels
                               letter-spacing: 0.08em

Tabular Numbers: font-variant-numeric: tabular-nums (for KPIs, prices, square footage, phone numbers)
```

### Spacing Scale

```
4px base unit grid

Space tokens:
├── xs:    4px     — Inline icon gaps, tight badge padding
├── sm:    8px     — Badge padding, compact card gaps
├── md:    12px    — Input padding, list item gaps
├── lg:    16px    — Card padding (mobile), standard page margins
├── xl:    20px    — Card padding (desktop)
├── 2xl:   24px    — Section separation
├── 3xl:   32px    — Major container breaks
├── 4xl:   48px    — Top/bottom page cushion

Content max-width: 1280px (7xl)
Card padding:      16px (mobile) / 20-24px (desktop)
Page padding:      16px (mobile) / 24px (tablet) / 32px (desktop)
Bottom nav height: 64px + env(safe-area-inset-bottom)
Top header height: 56px (mobile) / 64px (desktop)
```

### Elevation & Shadows

```
Level 0: none                                              — Flat elements
Level 1: 0 1px 3px rgba(0,0,0,0.3)                        — Cards, inputs
Level 2: 0 4px 12px rgba(0,0,0,0.4)                       — Dropdowns, tooltips
Level 3: 0 8px 24px rgba(0,0,0,0.5)                       — Bottom sheets, dialogs
Level 4: 0 16px 48px rgba(0,0,0,0.6)                      — FAB, floating action menus

Note: In dark theme, depth is communicated through background tone gradients
      (bg-secondary vs bg-surface) and border contrast rather than drop shadows.
```

### Border Radius

```
├── sm:      8px    — Badges, chips, small toggles
├── md:     12px    — Input fields, buttons, dropdowns
├── lg:     16px    — Cards, panels, toast notifications
├── xl:     20px    — Bottom sheets (top corners), modals
├── 2xl:    24px    — Large hero containers
├── full:   9999px  — Avatars, pill badges, FAB buttons
```

### Iconography

```
Library:     Lucide React (existing project dependency)
Default size: 20px (touch targets), 16px (inline), 14px (table/compact)
Stroke width: 1.75 (standard), 2.0 (active/emphasized)
Color:       text-secondary (slate-400) by default, amber-400 when active

Key icons mapping:
├── Dashboard:   LayoutDashboard
├── Leads:       Users
├── Tasks:       CheckSquare
├── Estimates:   FileText
├── Jobs:        Hammer
├── Crew:        UsersRound
├── Finances:    DollarSign
├── Calls:       Phone
├── Analytics:   BarChart3
├── Reports:     PieChart
├── Settings:    Settings
├── Quick Add:   Plus
```

---

## Component Library

### Buttons

#### Primary Button
```
Background:    amber-500 (#F59E0B)
Text:          slate-900 (#0F172A), font-weight: 600
Padding:       12px 24px
Border-radius: 12px
Min-height:    44px (touch target standard)
Hover:         amber-400
Active:        amber-600, transform scale(0.98)
Disabled:      opacity 40%, cursor not-allowed
Mobile:        Full-width block
Desktop:       Inline auto-width
```

#### Secondary Button
```
Background:    transparent
Border:        1px solid rgba(255,255,255,0.10)
Text:          slate-300, font-weight: 500
Hover:         bg rgba(255,255,255,0.05), border rgba(255,255,255,0.20)
Active:        bg rgba(255,255,255,0.08)
```

#### Ghost Button
```
Background:    transparent
Text:          slate-400
Hover:         text white, bg rgba(255,255,255,0.05)
Used for:      Icon-only quick actions, table row actions, dismiss buttons
```

#### Destructive Button
```
Background:    red-500/20
Text:          red-400
Border:        1px solid red-500/30
Hover:         red-500/30
```

### Input Fields

```
Background:    rgba(255,255,255,0.05)
Border:        1px solid rgba(255,255,255,0.10)
Border-radius: 12px
Padding:       12px 16px
Text:          white
Placeholder:   slate-500
Font-size:     16px on mobile (prevents iOS Safari auto-zoom), 14px on desktop
Min-height:    44px

States:
├── Focus:     border amber-500/50, ring 2px amber-500/20
├── Error:     border red-500/50, ring 2px red-500/20
├── Disabled:  opacity 50%, bg rgba(255,255,255,0.02)

Label:         slate-400, 12px, font-weight 500, uppercase, tracking-wider
Error text:    red-400, 12px, below input with smooth height expand
```

### Cards

#### Standard Card
```
Background:    bg-secondary (#1E293B) or bg-elevated (rgba(255,255,255,0.03))
Border:        1px solid rgba(255,255,255,0.06)
Border-radius: 16px
Padding:       16px (mobile) / 20px (desktop)
Hover:         border rgba(255,255,255,0.12) (interactive cards)
```

#### KPI Card
```
Layout:
├── Header:     Overline title (slate-400) + Icon (colored, 16px)
├── Value:      Large number (24-32px, font-weight 700, tabular-nums)
├── Footer:     Trend indicator (arrow + percentage or subtitle, Caption size)
Grid:           2 cols mobile, 3 cols tablet, 6 cols desktop
```

#### Lead Card (Mobile List Item)
```
Layout (horizontal, single row):
├── Left:       Avatar circle (36px, gradient amber→orange, first initial)
│               If priority hot: pulsing red dot on top-right of avatar
├── Center:     Name (Body, white, font-weight 500) + subtitle
│               Subtitle: service type + city (Caption, slate-500)
├── Right:      Status badge (pill) + timestamp below ("2h ago")
Padding:        12px 16px
Border-bottom:  1px solid rgba(255,255,255,0.05)
Tap target:     Full width (navigates to lead detail)
Swipe actions:  Swipe right = Call, Swipe left = Quick Status
```

### Badges & Status Pills

```
Padding:       4px 10px
Border-radius: 9999px (full pill)
Font-size:     11px
Font-weight:   600
Border:        1px solid (status color at 30% opacity)
Background:    status color at 20% opacity
Text:          status color at 100%

Variants:
├── new:        bg blue-500/20,    text blue-400,    border blue-500/30
├── contacted:  bg amber-500/20,   text amber-400,   border amber-500/30
├── inspected:  bg cyan-500/20,    text cyan-400,    border cyan-500/30
├── quoted:     bg purple-500/20,  text purple-400,  border purple-500/30
├── won:        bg emerald-500/20, text emerald-400, border emerald-500/30
├── lost:       bg red-500/20,     text red-400,     border red-500/30
├── overdue:    bg red-500/20,     text red-400,     border red-500/30 (pulsing ring)
```

### Bottom Sheet (Mobile Modal)

```
Trigger:        Slide up from bottom of viewport
Backdrop:       rgba(0,0,0,0.6) with backdrop-blur(4px)
Background:     bg-secondary (#1E293B)
Border-radius:  20px 20px 0 0 (top corners)
Drag handle:    40px × 4px rounded pill, bg slate-600, centered, 12px from top
Max-height:     88vh (preserves top status bar context)
Scroll:         Internal smooth momentum scrolling
Dismiss:        Swipe down gesture, tap backdrop, or top-right Close button
```

### Floating Action Button (FAB)

```
Position:       Fixed bottom-right
Mobile:         Right: 16px, Bottom: calc(64px + env(safe-area-inset-bottom) + 16px)
Desktop:        Right: 24px, Bottom: 24px
Size:           56px × 56px
Background:     amber-500 (#F59E0B)
Icon:           Plus, white, 24px
Border-radius:  16px (squircle shape)
Shadow:         Level 4 (0 16px 48px rgba(0,0,0,0.6))

Expandable Speed-Dial Menu:
Tap FAB → Rotates 45° to 'X', background dims, mini-FABs cascade upwards:
├── 1. "Add Lead"       (Users icon,     blue-500 bg)
├── 2. "Log Call"       (Phone icon,     emerald-500 bg)
├── 3. "Add Task"       (CheckSquare,    purple-500 bg)
└── 4. "New Estimate"   (FileText icon,  amber-500 bg)
```

---

## Navigation Architecture

### Desktop (≥ 1024px): Collapsible Sidebar

```
┌──────────────────────────────────────────────────────┐
│ ┌─────────┐ ┌──────────────────────────────────────┐ │
│ │ SIDEBAR │ │           MAIN CONTENT               │ │
│ │         │ │                                       │ │
│ │ Logo    │ │  Header (breadcrumbs, search, user)   │ │
│ │─────────│ │  ───────────────────────────────────  │ │
│ │ 📊 Dash │ │                                       │ │
│ │ 👥 Lead │ │  Content Area                         │ │
│ │ 📋 Task │ │  (scrollable independently)           │ │
│ │ 💰 Est  │ │                                       │ │
│ │ 🔨 Jobs │ │                                       │ │
│ │ 👷 Crew │ │                                       │ │
│ │ 💵 Fin  │ │                                       │ │
│ │ ───     │ │                                       │ │
│ │ 📞 Call │ │                                       │ │
│ │ 📈 Anly │ │                                       │ │
│ │ 📊 Rpt  │ │                                       │ │
│ │ ───     │ │                                       │ │
│ │ ⚙️ Set  │ │                                       │ │
│ └─────────┘ └──────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘

Sidebar specs:
├── Expanded width:  240px
├── Collapsed width: 64px (icons only, hover tooltips)
├── Background:      bg-primary (#0F172A)
├── Border-right:    1px solid rgba(255,255,255,0.06)
├── Active indicator:Left border 3px amber-400 + text white + bg white/5
└── Badge counts:    Overdue tasks count (red pill), new leads count (blue pill)
```

### Mobile (< 1024px): 5-Tab Bottom Navigation Bar

```
┌─────────────────────────────┐
│                             │
│      MAIN CONTENT           │
│      (scrollable)           │
│                             │
│                         [+] │  ← Floating Action Button
│                             │
├─────────────────────────────┤
│  🏠    👥    📋    🔨    ⋯  │  ← Clean Bottom Nav (64px)
│ Home  Leads Tasks  Jobs More│
└─────────────────────────────┘

Bottom Nav specifications:
├── Height:       64px + env(safe-area-inset-bottom)
├── Background:   #0F172A with backdrop-blur(12px)
├── Border-top:   1px solid rgba(255,255,255,0.08)
├── Tab layout:   5 equal columns (touch target min 48px width)
├── Icons:        20px Lucide icons, 10px bold caption labels below
├── Active state: Amber-400 icon and label + 4px amber dot indicator below
├── Inactive:     Slate-500 icon and label
└── Badge dot:    Red 8px notification dot for overdue tasks or unread leads

"More" Sheet Menu (5th Tab):
Slides up as a bottom sheet with clean grid shortcuts:
├── 💰 Estimates & Proposals
├── 👷 Crew Management
├── 💵 Financials & Payments
├── 📞 Phone Call Logs
├── 📈 Website Analytics
├── 📊 Executive Reports
└── ⚙️ System Settings & Templates
```

---

## Screen Specifications

### 1. Mobile Dashboard (`/admin/dashboard`)
- **Top Bar:** Rise Up logo icon, notification bell with badge, user avatar.
- **Greeting Card:** "Good morning, Mike ☀️", subtitle: "3 follow-ups scheduled today".
- **2x2 Quick KPI Grid:**
  - `14 Leads` (+3 today, 🟢 up)
  - `5 Tasks` (2 overdue, 🔴 alert)
  - `$47.2K` (Active pipeline value)
  - `89%` (Close rate this month)
- **Urgent Action Section:** "Today's Follow-ups" list with quick checkbox completion.
- **Recent Leads Section:** 3 most recent leads with 1-tap call button.
- **Active Jobs Widget:** Current jobs in progress with day progress indicator (e.g., "Day 2 of 5").

### 2. Mobile Leads Pipeline (`/admin/leads`)
- **Sticky Search & Filter Bar:** Full-text instant search by name, phone, address, or city.
- **Horizontal Filter Chips:** `All` | `New (4)` | `Contacted` | `Inspected` | `Quoted` | `Won` | `Lost`.
- **Card-based List View:** Each card displays:
  - Initials avatar with hot priority indicator dot.
  - Full Name & Phone Number.
  - Service type (e.g., "Residential Tile Reroof") + City ("Escondido").
  - Relative time stamp ("15m ago").
  - Status pill badge.
- **Touch Gestures:**
  - Swipe Right → Initiates immediate phone call dialer.
  - Swipe Left → Quick status transition drawer.
  - Tap → Opens full Lead Detail view.

### 3. Lead Detail View (`/admin/leads/[id]`)
- **Header:** Full customer name, score indicator (🔴 Hot - 85 pts), primary contact buttons:
  - `[ 📞 Call ]` (Triggers native phone app, auto-prompts call note logger on return)
  - `[ 💬 Text ]` (Pre-fills SMS with template)
  - `[ 📧 Email ]`
- **Segmented Control Tabs:**
  - **Property Tab:** Roof SQF, Pitch/Slope, Stories, Roof Type (Tile/Shingle/Flat), Roof Age, HOA rules.
  - **Timeline Tab:** Full chronological log of calls, notes, SMS, estimate views, and status changes with "+ Add Note" button.
  - **Estimates Tab:** Connected estimates, proposal status, sent date, and "+ New Estimate" CTA.
  - **Tasks Tab:** Pending reminders linked to this contact.

### 4. Tasks & Follow-up Center (`/admin/tasks`)
- **Segmented Tabs:** `Today` | `Upcoming` | `Completed`.
- **Overdue Section:** Highlighted in red with warning icon and days overdue.
- **Card Elements:** Checkbox, Title, Linked Contact/Job, Due Date & Time, Priority badge.
- **Completion Flow:** Checking task plays subtle haptic feedback, strikes through text, and displays an "Undo" toast.

### 5. Estimate Builder Wizard (`/admin/estimates/new`)
A 4-step mobile wizard designed for in-field estimating:
- **Step 1 (Roof Specs):** Auto-filled customer info, Roof Squares (with SQF calculator helper), Pitch selector (4:12 to 12:12), Number of Stories, Tear-off layers.
- **Step 2 (Materials):** Visual card picker:
  - Owens Corning Duration Shingles
  - Concrete Tile (Eagle)
  - Clay Tile
  - Commercial TPO Membrane
- **Step 3 (Add-ons & Scope):** Checkboxes for Dry Rot LF, Plywood sheets, Gutters, Skylights, Solar Detach & Reset.
- **Step 4 (Pricing & Proposal):** Auto-calculated Material cost, Labor cost, Target Margin slider (15% to 40%), Total Job Price, and Financing estimates ($X/mo at 0% APR).
- **Actions:** `[ Save Draft ]` and `[ Generate & Send Proposal ]`.

### 6. Jobs Kanban & Active Projects (`/admin/jobs`)
- **Mobile View:** Switchable between Stage Filtered List and Horizontal Kanban Swipe.
- **Desktop View:** Drag-and-drop 7-column board:
  1. `Permit Pending`
  2. `Material Ordered`
  3. `Scheduled`
  4. `In Progress`
  5. `Punch List`
  6. `Final Inspection`
  7. `Complete`
- **Job Cards Display:** Job # (JOB-2026-0042), Customer Name, Project Address, Contract Value, Assigned Crew Lead, Start/End Dates.

---

## Interaction Patterns

### Field-Tested Mobile Gestures
- **Pull-to-Refresh:** Pulling down on Leads, Tasks, or Jobs refreshes data from Postgres with an amber loader.
- **Swipe-to-Action:** Swipe right to Call; swipe left to advance status or snooze tasks.
- **Auto-Call Logger:** When returning to the app after tapping the call button, a bottom sheet automatically asks: *"Log this call? Reached / Voicemail / No Answer"*.
- **Offline Resilience / Low Signal:** Offline banner indicator with optimistic local state updates when working in poor signal areas.

---

## Animation & Motion
- **Bottom Sheet Entrance:** Spring animation (`damping: 26, stiffness: 280`) sliding up from bottom.
- **FAB Rotation:** 45° rotation transition when expanding into speed-dial actions.
- **Page Transitions:** Mobile slide-over navigation (200ms ease-out).
- **Micro-Interactions:** Tap scaling (`scale(0.97)`) on all buttons and cards for responsive physical feel.

---

## Accessibility
- **Touch Target Standard:** All interactive elements maintain a minimum size of 44×44px with 8px separation.
- **Contrast Ratio:** Text-to-background contrast exceeds WCAG AA standards (minimum 4.5:1).
- **Direct Sunlight Optimization:** High text luminance on deep backgrounds ensures readability on bright roofing job sites.

---

## Responsive Breakpoints
- **Mobile (< 640px):** Single-column layout, bottom navigation bar, full-width cards, bottom sheets for all modals.
- **Tablet (640px - 1023px):** 2-column dashboard grid, bottom nav, slide-over drawers.
- **Desktop (≥ 1024px):** Permanent collapsible left sidebar, multi-column tables, drag-and-drop Kanban board, modal dialogs.

---

## Component File Structure

```
components/admin/
├── layout/
│   ├── BottomNav.tsx           — Mobile bottom navigation (5 tabs + safe area)
│   ├── TopBar.tsx              — Mobile sticky top bar with notifications
│   ├── AdminSidebar.tsx        — Desktop collapsible sidebar navigation
│   └── MoreMenuSheet.tsx       — Mobile "More" tab slide-up grid menu
├── shared/
│   ├── FAB.tsx                 — Floating action button with speed-dial
│   ├── BottomSheet.tsx         — Reusable touch-draggable bottom sheet
│   ├── KpiCard.tsx             — Metric card with trend indicator
│   ├── StatusBadge.tsx         — Consistent pipeline & priority badges
│   ├── Avatar.tsx              — Initial avatar with hot priority indicator
│   └── SearchInput.tsx         — Instant filter search bar
├── leads/
│   ├── MobileLeadCard.tsx      — Swipe-enabled list item for mobile
│   ├── LeadsTable.tsx          — Responsive table for tablet & desktop
│   ├── AddLeadSheet.tsx        — Quick-entry bottom sheet for new leads
│   └── LeadPropertyTab.tsx     — SQF, pitch, stories, and roof type viewer
├── timeline/
│   ├── ActivityTimeline.tsx    — Vertical connector activity feed
│   └── LogCallSheet.tsx        — Post-call notes logger modal
├── tasks/
│   ├── TaskItem.tsx            — Swipe-to-complete task row
│   └── AddTaskSheet.tsx        — Rapid task creation sheet
└── estimates/
    ├── EstimateWizard.tsx      — 4-step mobile field cost calculator
    └── ProposalPreview.tsx     — Branded PDF / online approval preview
```
