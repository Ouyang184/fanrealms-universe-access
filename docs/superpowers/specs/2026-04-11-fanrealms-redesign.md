# FanRealms Redesign Spec
**Date:** 2026-04-11  
**Status:** Approved

---

## Overview

Redesign FanRealms into a modern indie creator platform — marketplace, job board, forum, and indie game showcase. The design takes itch.io's energy (bold, human, creator-focused) but improves it with a modern app-like experience, a dark sidebar layout for logged-in users, and community surfaced as a first-class feature.

---

## Design System

### Logo
- **Mark:** Castle tower SVG icon on a red (`#e11d48`) rounded tile
- **Wordmark:** "Fan" (dark/white depending on bg) + "Realms" (red) in Space Grotesk 700
- **Favicon:** Same castle tower mark at 16×16 and 32×32

### Colors
| Token | Value | Usage |
|---|---|---|
| Primary | `#e11d48` | Buttons, active states, accents, logo |
| Primary hover | `#be123c` | Button hover |
| Background | `#ffffff` | Page background |
| Surface | `#f5f5f5` | Page background (logged-in) |
| Card | `#ffffff` | Card/panel background |
| Border | `#eeeeee` | Card and panel borders |
| Sidebar bg | `#111111` | Sidebar background |
| Sidebar hover | `#1a1a1a` | Sidebar nav hover |
| Sidebar active | `#1f1f1f` | Sidebar nav active item |
| Text primary | `#111111` | Headings, body |
| Text muted | `#888888` | Secondary text |
| Text dim | `#aaaaaa` | Timestamps, labels |
| Success | `#16a34a` | Positive stats |

**No gradients anywhere. No emoji in UI.**

### Typography
- **Font:** Space Grotesk (Google Fonts)
- **Weights used:** 400, 500, 600, 700
- **Headings:** 700, tight letter-spacing (−0.5px to −1.5px)
- **Body:** 500, 14px base

### Spacing & Shape
- **Border radius:** Cards 12px, buttons 8–10px, pills 99px, avatars 8px
- **Card shadow (hover):** `0 6px 20px rgba(0,0,0,0.08)` + `translateY(-2px)`
- **Panels:** 1px `#eee` border, no shadow at rest

---

## Architecture — Hub & Spoke

### Public (logged-out)
Single landing page with top navigation. Surfaces all four sections to communicate the platform's breadth. Goal: convert visitors to sign up.

**Sections on landing page:**
1. Nav (logo, links, search, login/signup)
2. Hero (headline, CTA buttons, platform stats)
3. New in Marketplace (4-column asset grid with pill filters)
4. Indie Games (4-column game grid with external links)
5. Open Jobs (list)
6. Forum (thread list)
7. Footer

### Authenticated (logged-in)
Dark sidebar layout — feels like a platform you live in, not a storefront you visit. This is the primary differentiator from itch.io.

---

## Navigation

### Top Nav (public)
```
[Logo] Marketplace  Games  Jobs  Forum  Explore    [Search] [Log in] [Sign up]
```

### Sidebar (authenticated)
Dark background (`#111`). Two main groups, creator studio appears after first product/game created.

**Discover**
- Home
- Explore
- Marketplace
- Indie Games

**Community**
- Forum (with unread badge)
- Jobs
- Following
- Messages (with unread badge)

**Creator Studio** *(hidden until user creates first product or game)*
- Dashboard
- My Products
- My Games
- Commissions (with badge)
- Earnings
- Analytics

**Account** *(bottom)*
- Purchases
- Settings

**Profile** *(sidebar footer)*
- Avatar, username, handle

---

## Pages

### Home (authenticated dashboard)
Personalized view. Not a storefront — a platform home.

**Layout:**
- Greeting ("Good afternoon, [name]")
- 4 stat cards: Followers, Asset Sales, Open Jobs, Forum replies
- Community Activity feed (wide) + Creators to Follow (narrow sidebar) — 2/3 + 1/3 grid
- Open Jobs + Active Forum Threads — 1/2 + 1/2 grid

### Marketplace
- Page header + "Sell something" button
- Pill category filters (All, Game Assets, Templates, Tools, Music, Art, Other)
- 4-column product grid
- Each card: thumbnail (4:3), title, author, price, category badge

### Indie Games
- Page header + "Add your game" button  
- Pill genre filters
- 4-column game grid
- Each card: thumbnail (16:9), title, studio, genre pill, external link label (Steam / itch.io / etc.)
- No file hosting — links out only

### Jobs
- Page header + "Post a job" button
- Category filter pills
- List layout (not grid) — each row: avatar initials, title, studio, time posted, type pill (Contract/Bounty/Freelance/Part-time), pay
- Red dot indicator for new listings

### Forum
- Page header + "New thread" button
- Category filter pills
- List layout — each row: user avatar, thread title, category + author + time, reply count

### Creator Studio — Dashboard
- Only visible after first product or game created
- Earnings chart (Recharts — already in dependencies)
- Recent sales table
- Active commissions
- Quick actions: Add product, Add game, View analytics

---

## User Model

No separate creator account type. Single user schema.

- Everyone can access creator tools immediately (itch.io approach)
- **Creator Studio sidebar section is hidden** until user has created at least one product or game
- First time user clicks "Sell something" or "Add your game" — short inline setup (display name, payout via Stripe Connect)
- After setup, Creator Studio permanently visible in sidebar
- No `is_creator` flag needed — presence of products/games drives the UI state

---

## Key Components to Build/Update

| Component | Change |
|---|---|
| `Logo.tsx` | Replace with castle tower SVG + Space Grotesk wordmark |
| `index.css` | Update CSS variables to new color tokens + import Space Grotesk |
| `Landing.tsx` | Full redesign — new hero, 4-section layout, top nav |
| `MainLayout.tsx` | Keep sidebar structure, apply new dark sidebar styles |
| `Sidebar/` | Dark theme, new section groupings, creator studio conditional visibility |
| `Marketplace.tsx` | New pill filters, 4-column grid layout |
| `Jobs.tsx` | List layout with new row design |
| `Forum.tsx` | List layout with new thread row design |
| `Home.tsx` | New dashboard layout — greeting, stats, activity feed, creators |
| New: `Games.tsx` | Indie games showcase page |
| New: `GamesSection` component | Game card (16:9 thumb, external link) |

---

## Database Changes

One new table required:

```sql
create table indie_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  genre text,
  thumbnail_url text,
  external_url text not null,        -- Steam / itch.io / etc.
  external_platform text,            -- "Steam", "itch.io", "GameJolt", etc.
  created_at timestamptz default now()
);
```

No other schema changes. No auth changes. No changes to existing tables.

---

## Out of Scope

- Changes to existing database tables
- Payment flow changes (Stripe Connect setup already exists)
- Auth system changes
- Mobile app / responsive breakpoints (desktop-first for now)
- Dark mode toggle (sidebar is dark, content area is light — fixed)
