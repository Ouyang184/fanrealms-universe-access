
The user wants the marketplace to feel less "generic AI" and more like itch.io — which has a very specific personality: dense info, sharp edges, utilitarian sidebar, popular tags front-and-center, no rounded card overload, no big hero CTAs, lots of real content above the fold.

Looking at the itch.io reference and our current `/marketplace`:

**What itch.io does that we don't:**
1. Left utility sidebar with "Popular Tags", "Browse" categories, "Games by Price" filters — visible immediately, no clicks needed
2. Top thin info strip ("itch.io is a simple way to..."), not a giant marketing hero
3. Featured content (carousel/banner) takes the prime real estate, not marketing copy
4. Dense, scannable lists everywhere — not airy cards with whitespace
5. Sharp corners, hairline borders, plain backgrounds — no gradients, no glass, no shadows
6. Real links and text dominate; buttons are minimal

**Our current marketplace problems:**
- Big colored hero ("Sell your game assets. Keep 95%.") eats the fold
- No left sidebar with browseable tags/categories
- Cards-first layout feels like a generic SaaS template
- No "featured" spotlight
- Round corners + soft borders everywhere = generic

### Plan: Itch.io-inspired marketplace redesign

Restructure `/marketplace` into a **3-zone layout** matching itch.io's information density:

**1. Slim info strip (replaces big hero)**
One line at the top: "FanRealms is a marketplace for indie creators — keep 95%. **Upload an asset** or **Read the FAQ**." Plain text, two inline links. ~40px tall.

**2. Left utility sidebar (~220px)**
- **Popular Tags**: 2-column list of clickable tags (Pixel Art, RPG, Horror, Tools, Music, etc.) — pulled from real product tags
- **Browse**: Categories (Game Assets, Templates, Tools, Music, Art, Tutorials)
- **By Price**: On Sale, Free, $5 or less, $15 or less, Paid
- Plain text links, no icons, no boxes — pure utility

**3. Main content column**
- **Featured spotlight** (top): one large featured product card with cover art, title, price, "Get the asset" button — itch.io's Rhythm Doctor banner equivalent
- **Section: New & Noteworthy** — existing product grid, but tighter (smaller cards, sharper borders, denser)
- **Section: Top Sellers** — same grid style
- **Section: Free this week** — same grid style

### Visual style adjustments (marketplace only)
- Sharp corners (`rounded-none` or `rounded-sm`) on cards in this page
- Hairline borders (`border-border`), no shadows
- Section headings: small bold uppercase ("NEW & NOTEWORTHY"), thin underline rule
- Remove the dark hero entirely
- Keep `MarketplaceTopNav` as-is (already top-nav)

### Files to change
- `src/pages/Marketplace.tsx` — restructure to 3-zone layout, drop hero
- `src/components/marketplace/MarketplaceSidebar.tsx` *(new)* — left utility nav with tags/categories/price
- `src/components/marketplace/FeaturedSpotlight.tsx` *(new)* — large featured product banner
- `src/components/marketplace/ProductGrid.tsx` *(reuse if exists, else tighten card styles)* — denser card variant

### Out of scope
- Changing other pages (Home, Forum, Jobs)
- New backend/data — featured can be picked by `is_featured` flag or just newest for now
- Changing global theme tokens
