
The screenshot shows the populated state still has tons of empty space below the fold because there are no real products. The empty state's category tiles fill ~1/3 of the viewport width, leaving a huge blank area below. The sidebar also ends around y=750 with nothing under it.

### Plan: Fill the page with browseable content

**1. Expand category tiles to a richer browse zone**
Current tiles are plain text in 4 columns. Make them denser, taller, and 2-row with more info:
- 4 columns × 2 rows of category cards
- Each card: category name (bold), short tagline ("Sprites, tilesets, characters…"), and a count placeholder ("Browse →")
- Sharp borders, hover state, fills more vertical space meaningfully

**2. Add "Featured creators" strip**
Below categories, a horizontal row of 4–6 creator avatars + names pulled from `creators` table (top creators or newest). Dense, itch.io-style.

**3. Add "Recently joined" / community block**
A two-column block:
- Left: "Latest forum discussions" (3–4 recent posts, title + author)
- Right: "Open job listings" (3–4 recent gigs, title + budget)
This makes the marketplace feel like a hub even with zero products, and uses existing data from the other two pillars.

**4. Add a footer-info strip at bottom**
Three columns: "For creators" (Upload, Pricing, FAQ), "Explore" (Marketplace, Forum, Jobs), "About" (links). Pure text, dense, fills the bottom edge.

**5. Sidebar**
Add an extra section at the bottom: "**Quick links**" with Forum, Jobs, Become a creator, FAQ — fills the sidebar's empty bottom area.

### Files to change
- `src/pages/Marketplace.tsx` — expand `EmptyState` with richer category cards, add Featured creators strip, add Forum+Jobs cross-pillar block, add footer info strip
- `src/components/marketplace/MarketplaceSidebar.tsx` — add "Quick links" section at the bottom
- `src/hooks/useCreators.ts` *(reuse if exists, else a small inline query)* — fetch top creators
- May reuse existing forum/job hooks — will inspect `src/hooks/` for `useForumPosts`, `useJobs` or equivalent before implementing

### Out of scope
- Creating fake/demo products
- Touching populated state (only changes when product list is empty)
- New backend tables
