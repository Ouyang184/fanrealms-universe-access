# Landing Page Redesign — Godot-First Positioning

**Date:** 2026-04-17  
**Status:** Approved  

## Goal

Reposition the FanRealms landing page from a generic "indie creator marketplace" to a Godot-first hub. The copy and visual identity should immediately signal to a Godot developer that this site was built for them, while the underlying platform structure stays broad enough to expand to other engines and asset types later.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Hero headline | "Where Godot devs buy, sell & ship." | Signals community hub, not just a file store. Leaves room to expand later. |
| Subheadline | "Assets, indie games, freelance gigs, and a community — all built around the Godot engine." | Names all 4 platform sections; anchors to Godot. |
| Accent color | `#478cbf` (Godot blue) — site-wide | Matches Godot's brand, signals immediately who this is for. |
| Hero cards | 4 platform sections | Godot Assets · Indie Games · Jobs & Gigs · Community |
| Emojis | None | Keep icons only (lucide-react) |

## Scope

This spec covers changes to `src/pages/Landing.tsx` and the global accent color (`--primary` in CSS / Tailwind config).

**In scope:**
- Hero section copy + cards
- "How it works" section copy
- Marketplace preview section label
- Empty state copy (when no products/jobs/threads exist)
- Nav label updates
- Footer tagline
- Global accent color swap from rose/red to Godot blue

**Out of scope:**
- Site name change ("FanRealms" stays for now — worth revisiting if Godot community adoption grows)
- New pages or routes
- Marketplace category schema changes
- Any backend / Supabase changes

## Sections

### 1. Nav
- Links stay the same: Marketplace, Explore, Games, Jobs, Forum
- "Marketplace" can be mentally read as "Godot Assets" by context — no label change needed yet
- Log in / Sign up buttons update to Godot blue

### 2. Hero
```
Headline:    Where Godot devs
             buy, sell & ship.

Subtext:     Assets, indie games, freelance gigs, and a community —
             all built around the Godot engine.

CTA row:     [Browse assets]   [Sell your work]
Trust line:  Free to join · Payments secured by Stripe · No hidden fees
```

**4 hero cards (right side):**
| Icon | Title | Description |
|---|---|---|
| ShoppingBag | Godot Assets | Plugins, shaders, sprites & tools |
| Monitor (or Gamepad2) | Indie Games | Play & discover Godot-made games |
| Briefcase | Jobs & Gigs | Hire or get hired as a Godot dev |
| MessageSquare | Community | Forum, devlogs & help |

### 3. How it works
Update step copy to be Godot-specific:
1. **Sign up free** — "Create your account in seconds. Free to browse and download."
2. **Find or list Godot assets** — "Buy plugins, shaders, and sprites — or list your own packs for sale."
3. **Build & ship** — "Get the tools you need, find collaborators, and ship your Godot game."

### 4. Marketplace preview section
- Heading: "New Godot assets" (was "New in Marketplace")
- Empty state headline: "Be the first to list a Godot asset"
- Empty state body: "No assets yet — upload a plugin, shader pack, or sprite set and be the first seller."

### 5. Jobs + Forum empty states
- Jobs: "Post a Godot gig" / "Looking for a GDScript dev, pixel artist, or sound designer?"
- Forum: "Start the first Godot thread" / "Ask a question, share a devlog, or introduce your project."

### 6. Footer
- Tagline under logo: "The Godot asset hub."
- Links unchanged

## Color Change (site-wide)

Replace the current primary color (rose/red `#e11d48`) with Godot blue `#478cbf` across:
- `tailwind.config.ts` or `tailwind.config.js` — update `primary` color token
- All references to `bg-primary`, `text-primary`, `border-primary` in components automatically pick up the new value

Hover state: `#3a7aab` (slightly darker blue, replaces `#be123c`)

## Future Expansion Note

The "Godot-first" framing is in the copy only — not in the data model. When the time comes to expand:
- Add engine filter to marketplace (Godot / Unity / Godot / GameMaker / Any)
- Update hero headline to "The indie dev marketplace" or similar
- The platform sections (Assets, Games, Jobs, Community) work for any engine without changes
