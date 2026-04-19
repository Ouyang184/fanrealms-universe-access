
The user is on `/games` and uploaded a screenshot of the genre pill bar. They want the Games page styling (and likely the pill bar specifically) to fit the marketplace's visual style — which uses square/sharp borders, uppercase section headers, and tighter density rather than the current rounded white pills with primary teal fill.

Looking at `Games.tsx` vs `Marketplace.tsx`:
- Marketplace uses: `border border-border bg-card`, square corners, `text-[11px] font-bold uppercase tracking-wider` section headers, `border-b border-border pb-2` dividers, hairline cards.
- Games currently uses: `rounded-full` pills, `rounded-xl` cards, `text-[#888]` ad-hoc colors, hex literals.

### Plan
Restyle `src/pages/Games.tsx` to match marketplace tokens:

1. **Header row** — replace `text-[20px] font-bold tracking-[-0.5px]` + `text-[#888]` with marketplace pattern: bottom-bordered title section using `text-[13px] font-bold uppercase tracking-wider text-foreground` style, OR keep a page title but switch to `text-foreground`/`text-muted-foreground` semantic tokens. Use marketplace's "Add your game" CTA style: `inline-flex items-center px-3 h-8 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90` (square, not rounded).

2. **Genre pills (the screenshot)** — convert from `rounded-full` white pills to marketplace-style square chips:
   - Inactive: `border border-border bg-card text-foreground hover:border-foreground hover:bg-accent px-3 py-1.5 text-[12px] font-semibold`
   - Active: `border border-foreground bg-foreground text-background` (or `bg-primary text-primary-foreground border-primary`)
   - Square corners (no `rounded-full`).

3. **Section header** — wrap the games grid in a `SectionBlock`-style header: `border-b border-border pb-2 mb-4` with `text-[13px] font-bold uppercase tracking-wider` title ("All games" / selected genre) and `text-[11px] text-muted-foreground` count meta.

4. **Empty state** — restyle to marketplace's compact utility-notice pattern: `border border-border bg-card px-4 py-3` row with title + CTA, square primary button. Drop the centered icon-tile look.

5. **Skeletons** — switch `aspect-video rounded-xl` to `aspect-[4/3]` with no rounding to match marketplace `ProductGridDense` density. Adjust grid to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3`.

6. **Color tokens** — replace hex literals (`#888`, `#f5f5f5`, `#aaa`, `#111`, `#3a7aab`, `#e5e5e5`, `#ccc`, `#666`) with semantic tokens (`text-muted-foreground`, `text-foreground`, `bg-muted`, `border-border`, `bg-primary hover:bg-primary/90`).

### Out of scope
- `GameCard` internal styling (separate component — only touch if it visibly clashes; can be a follow-up).
- Adding new sections (Featured, Top picks) — keep the single grid for now.
- Other pages.

### Files to change
- `src/pages/Games.tsx` — restyle header, pills, section wrapper, empty state, skeletons, and swap hex colors for semantic tokens.
