
Looking at the screenshot: the empty state panel is huge and centered in a sea of whitespace because there are no products. But the bigger issue the user is pointing at is the overall page feels empty/loose — the sidebar is narrow, the main column has one big empty card, and there's nothing filling the page.

Two things to fix:

### 1. Tighten the empty state
Currently the "No assets match these filters" panel is full-width and very tall with big padding. Make it compact — smaller padding, smaller heading, left-aligned, hairline border. It should feel like a utility notice, not a hero.

### 2. Fill the page when empty
itch.io never shows a blank page — even with no results, it shows browseable content. Add a **"Browse by category"** tile grid below the empty notice (6 category tiles: Game Assets, Templates, Tools, Tutorials, Music, Art, Other) that click through to filter the marketplace. Dense, sharp-edged, 3-4 across.

Also add a **"Popular tags cloud"** block below that — pulls from `usePopularTags` (already loaded in `Marketplace.tsx` but currently only shown in sidebar). Inline tag pills, dense.

### 3. Reduce vertical gaps
- `space-y-10` between main sections → `space-y-6`
- `space-y-6` outer → `space-y-4`
- Sidebar `space-y-6` → `space-y-5`
- Info strip `pb-3` is fine, but the gap below (`gap-8`) → `gap-6`

### Files to change
- `src/pages/Marketplace.tsx` — tighten `EmptyState` (compact notice + category tiles + tag cloud), reduce spacing
- `src/components/marketplace/MarketplaceSidebar.tsx` — minor: tighten `space-y-6` → `space-y-5`

### Out of scope
- Loading fake/demo products
- Changing the populated-state layout (only shows when empty)
- Sidebar restructure

