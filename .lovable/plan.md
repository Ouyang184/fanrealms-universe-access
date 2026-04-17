
## Two Layout Modes — Home vs Marketplace

You're right — the marketplace deserves a top-nav storefront feel, while Home/dashboard work better with the sidebar. Here's the clean split:

### Two distinct shells

**Marketplace shell (top nav)** — `MarketplaceLayout`
Public storefront feel (itch.io / Steam-like). Search-first, category nav, no sidebar.

**App shell (sidebar)** — `MainLayout`
Logged-in workspace feel. Dark sidebar with Discover / Community / Creator Studio.

### Route assignments

| Route | Layout |
|---|---|
| `/` (landing) | Marketplace top-nav |
| `/marketplace` | Marketplace top-nav |
| `/games` | Marketplace top-nav |
| `/product/:id` | Marketplace top-nav |
| `/search` | Marketplace top-nav |
| `/creator/:username` | Marketplace top-nav (public storefront) |
| `/home` | Sidebar |
| `/creator-studio/*` | Sidebar |
| `/messages`, `/settings`, `/purchases` | Sidebar |
| `/forum`, `/jobs` | Sidebar (community/app features) |

### Bridges between them
- Marketplace top nav has a "Dashboard" icon (when logged in) → `/home`
- Sidebar has "Marketplace" / "Indie Games" links → `/marketplace`
- Logo always returns to `/`

### What changes
- Audit `src/App.tsx` and wrap each marketplace-y route in `MarketplaceLayout` instead of `MainLayout`
- Keep `/home` and creator studio on `MainLayout`
- No new components, no design changes — purely a routing reassignment

### Out of scope
- New layouts or components
- Visual redesign of either shell
- New routes
