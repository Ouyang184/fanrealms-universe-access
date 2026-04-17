
## Plan: Global Teal/Cyan Light Theme

### Goal
Switch the entire site from the current dark blue scheme to a clean light theme with a teal/cyan accent.

### Changes

**1. `src/index.css` — `:root` tokens (light is now default)**
- `--background: 180 20% 98%` (near-white, faint teal tint)
- `--foreground: 200 25% 12%` (deep slate)
- `--card` / `--popover`: `0 0% 100%`
- `--primary: 184 72% 40%` (teal-cyan)
- `--primary-foreground: 0 0% 100%`
- `--secondary / --muted / --accent: 185 30% 95%`
- `--secondary-foreground / --accent-foreground: 200 25% 15%`
- `--muted-foreground: 200 10% 40%`
- `--border / --input: 185 20% 88%`
- `--ring: 184 72% 40%`
- Sidebar tokens mirrored to the light teal palette
- Scrollbar colors updated to light-mode greys (`hsl(185 15% 75%)` thumb)

**2. `src/index.css` — `.dark` retained but retuned to teal**
- Keep dark mode functional with same teal accent (`184 72% 50%`) so users who toggle dark still get the new brand.

**3. Default theme**
- `src/components/theme-provider.tsx`: confirm `defaultTheme` consumers pass `"light"`. Inspect `App.tsx` / wherever `ThemeProvider` is mounted and switch its `defaultTheme` prop to `"light"`.

**4. Hardcoded color cleanup (high-traffic only)**
Replace common hardcoded dark classes that would look broken on light bg with semantic tokens. Targeted sweep via search for: `bg-gray-900`, `bg-gray-800`, `text-gray-300`, `border-gray-700/800`, `bg-[#3a7aab]`, `text-purple-400`.
- Swap `bg-gray-900/800` → `bg-card` or `bg-secondary`
- `text-gray-300/400` → `text-muted-foreground`
- `border-gray-700/800` → `border-border`
- `bg-[#3a7aab]` (primary hover) → `hover:bg-primary/90`
- `text-purple-400` → `text-primary`

Scope of sweep: `src/components/explore/*`, `src/components/home/*`, `src/components/Layout/*`, `src/pages/Explore.tsx`, plus any other files surfaced by the search. I'll batch-update only the color utility classes — no structural/layout changes.

### Out of scope
- No new components, no layout changes, no logo redesign (logo blue `#478CBF` will remain as-is or get a quick teal tweak if you want — say the word).

### Technical notes
- All colors stay in HSL token form so future re-theming is a one-file change.
- Tailwind config already maps tokens; no `tailwind.config.ts` edits needed.
- After applying, I'll spot-check Explore, Home, and a creator page for any residual hardcoded dark colors and fix them.
