
You raised three things — let me address each, then propose a plan.

### 1. "One stripe across all the words"
Right now each genre is its own bordered box, which reads as 10 disconnected chips. I'll convert it into a **single segmented bar**: one outer border, genres separated by thin vertical dividers, active genre filled. Same marketplace tokens, just unified visually.

### 2. "Option for more games"
Two interpretations — I'll do both since they're cheap:
- **Pagination**: Show 24 games initially with a "Load more" button (or just the count if under 24).
- **Persistent submit CTA**: Keep the "Add your game" button visible in the header (already there) and add an inline submit-prompt card at the end of the grid so it's visible even when scrolled.

### 3. "Do we need games if we have marketplace?"
My take: **keep both, but clarify the distinction**. They serve different purposes:
- **Marketplace** = paid digital products you sell (assets, templates, tools) — Stripe Connect, money flows through FanRealms.
- **Games** = free showcase of finished indie games linking out to itch.io / Steam — discovery, not commerce.

Removing Games would lose the "show off what you built" pillar that complements Marketplace's "sell what you made". But if it feels redundant, an alternative is to **merge Games as a category inside Marketplace** with an "External link" product type. That's a bigger refactor though.

I'll proceed with **keeping Games separate** for now and just improving it. If you'd rather merge or delete, say the word and I'll do that instead.

### Plan

**File: `src/pages/Games.tsx`**
1. Replace the chip row with a segmented bar:
   - One outer `border border-border bg-card` wrapper, `flex`, `divide-x divide-border`.
   - Each genre = `flex-1 px-3 h-9 text-[12px] font-semibold` button.
   - Active = `bg-primary text-primary-foreground`; inactive = `hover:bg-accent`.
   - Horizontally scrollable on narrow viewports (`overflow-x-auto`), no wrap.
2. Add pagination: track `visibleCount` state (default 24), slice `games`, show "Load more (N remaining)" button below grid when more exist.
3. Add an end-of-grid "Submit your game" prompt card matching the empty-state style, shown when there's at least 1 game.
4. Add a one-line clarifier under the info strip: *"Free showcase — for paid assets, see the Marketplace."* with a link to `/marketplace`.

### Out of scope
- Merging Games into Marketplace (separate decision).
- Changing `GameCard` internals.
- Backend pagination (client-side slice is fine until volume grows).
