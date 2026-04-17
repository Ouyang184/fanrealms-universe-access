
## Plan: Full Marketplace Redesign + Emoji Purge

### Goal
Convert the entire site from a Patreon-style subscription feed into an itch.io-inspired digital marketplace. Remove all decorative emojis sitewide.

### Scope (all pages)
- Landing (`/`), Explore (`/explore`), Home dashboard, Creator profile, Commissions, Job Board, Forum, Search results, Category pages.

### Design system additions
- **`ProductCard`** — cover image, title, creator handle, price chip, rating (stars + count), category pills. Replaces `ContentItem` in marketplace contexts.
- **`MarketplaceHero`** — large search bar + category quick-pills (no big "Subscribe" CTA, no hero copy fluff).
- **`FilterSidebar`** — facets: category, price range (Free / Paid / Pay-what-you-want), rating, tags, sort (Popular / New / Top rated / Price).
- **`CategoryTileGrid`** — compact tile grid with icon + name + count.
- **`StorefrontHeader`** (creator profile) — banner, avatar, name, rating, follow button, tabs: Products / Commissions / Devlogs / About.

### Page-by-page changes

**Landing (`src/pages/Index.tsx` + `src/components/home/*`)**
- Replace `HeroSection` → `MarketplaceHero` (search-first).
- Replace `ContentTabs` (For You / Trending / Recent feed) → product grids: "Trending now", "New releases", "Top rated this week".
- Drop `CommissionSection` hero block → small "Hire creators" tile in a 3-up promo row.
- Keep `FeaturedCreators` but restyle as storefront cards (avatar + product count + rating).
- `CategoriesSection` → `CategoryTileGrid`.
- Remove `HowItWorks` (Patreon-y); replace with "Browse by category" + "Recently updated" rows.

**Explore (`src/pages/Explore.tsx`)**
- 2-column layout: `FilterSidebar` (left, sticky) + `ProductCard` grid (right, 3–4 cols responsive).
- Remove `CommunitySection`, `NewsletterSection`, `DiscoverSection` (subscription-marketing blocks).
- Keep `PopularTagsSection` as a horizontal chip rail above the grid.
- Top toolbar: result count, sort dropdown, view toggle (grid/list).

**Home dashboard (`src/components/home/HomeDashboard.tsx`)**
- Pivot from social feed → buyer dashboard: "Your Library" (purchased), "Wishlist", "Recommended for you", "Continue browsing".

**Creator profile**
- Replace tier/subscription emphasis with `StorefrontHeader` + product grid as default tab. Tiers move under a secondary "Membership" tab.

**Commissions / Job Board / Forum**
- Apply marketplace card styling, consistent filter sidebar pattern, remove decorative emojis from category labels and seed data.

### Emoji purge
- Sweep all `src/**/*.{ts,tsx}` for unicode emoji ranges (`\u{1F300}-\u{1FAFF}`, `\u{2600}-\u{27BF}`, `\u{1F900}-\u{1F9FF}`).
- Decorative → delete.
- Meaningful (category icons, status) → replace with `lucide-react` (e.g., 🎨 → `<Palette/>`, 🎮 → `<Gamepad2/>`, 📚 → `<BookOpen/>`, ✨ → `<Sparkles/>` only if structural, else remove).
- Sweep DB seed/category labels via a migration if categories table stores emojis in names.

### Technical notes
- New components in `src/components/marketplace/`.
- Reuse existing semantic tokens (teal/cyan light theme already in place).
- No DB schema changes required for the visual redesign; only a data-cleanup migration if category names contain emojis.
- Existing hooks (`usePosts`, `useCreators`, etc.) are reused — `ProductCard` accepts the same `Post`/creator shape so swap is mechanical.
- Preserve all routes and auth flows; this is a presentation-layer overhaul.

### Out of scope
- New backend features, payment changes, new tables.
- Logo redesign.
