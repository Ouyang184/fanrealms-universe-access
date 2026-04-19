
The user wants the top nav bar to also span full width (edge-to-edge) like the marketplace content now does, instead of being constrained to `max-w-7xl`.

Looking at `MarketplaceTopNav.tsx`, both rows use `max-w-7xl mx-auto` which centers them and leaves whitespace on the sides at wide viewports.

### Plan
Change both inner containers in `src/components/marketplace/MarketplaceTopNav.tsx` from `max-w-7xl mx-auto` to `w-full` so the nav content (logo, search, account links on top row; category links on bottom row) stretches edge-to-edge, matching the full-width marketplace body.

### Files to change
- `src/components/marketplace/MarketplaceTopNav.tsx` — replace `max-w-7xl mx-auto` with `w-full` on both the top row and bottom category row

### Out of scope
- Touching `TopNav.tsx` (used on other pages — those pages still use the constrained layout)
- Restructuring nav content or links
- Sticky behavior (keeps working as-is)
