## Goal
Make the "Featured Asset" spotlight on the Marketplace visually smaller. The cover image currently dominates the viewport because on desktop the image cell stretches to whatever height the grid row ends up at, with no upper bound.

Do **not** change:
- Cover upload validation (`AssetFormDialog.handleCoverChange` — file type, 5MB cap, 16:9 guidance)
- Storage bucket / RLS / upload path
- The product data shape

## Change (single file)
Edit `src/components/marketplace/FeaturedSpotlight.tsx` only.

1. Reduce the grid ratio on desktop from `1.4fr_1fr` to roughly `1fr_1fr` so the image column isn't oversized.
2. Give the image cell a bounded aspect on desktop instead of `md:aspect-auto`, e.g. `md:aspect-[16/9]`, and add a `max-h-[360px]` (or similar) cap so it can never grow into a hero-sized banner.
3. Slightly tighten the right-column padding / title size so the whole section feels more like an itch.io featured strip and less like a hero.

No behavioral changes — this is purely presentational CSS on the spotlight container. Upload flow, image dimensions, and existing cover URLs continue to work exactly as today (object-cover still handles any aspect ratio).

## Optional follow-up (not in this change)
If you later want the spotlight even denser, we can switch to a horizontal "strip" layout (small square thumb on the left, text on the right) — say the word and I'll do that as a second pass.
