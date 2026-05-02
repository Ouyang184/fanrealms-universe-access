## Goal

Make the landing page span the same width as the Marketplace page so the heavy white space on the sides goes away.

## Current state

- **Marketplace** (`src/pages/Marketplace.tsx`) uses `MainLayout` with `fullWidth`, which renders content edge-to-edge with only `px-4 sm:px-6` gutters.
- **Landing** (`src/pages/Landing.tsx`) wraps every section in `max-w-6xl mx-auto px-6` (~1152px capped), producing the wide white margins visible in the screenshot.

## Change

Single file: `src/pages/Landing.tsx`. Swap every `max-w-6xl mx-auto px-6` wrapper for an edge-to-edge gutter that matches Marketplace.

Sections affected (10 wrappers):
- Sticky header (line 19)
- Hero section (line 51)
- How it works (line 91)
- Latest from the marketplace (line 128)
- Open jobs / gigs (line 168)
- Inner sub-section (line 174)
- Forum / community section (line 186)
- Final CTA / extra section (line 252)
- Footer (line 280)

Replace each `max-w-6xl mx-auto px-6` with `px-4 sm:px-6` (no max-width, matching MainLayout fullWidth behavior).

## What stays the same

- All visual styling, fonts, colors, section backgrounds, borders.
- Internal grid layouts and gap sizes.
- Vertical padding (`py-*`) values.
- The custom landing-page header and footer (we are not switching to MainLayout, since the landing has a bespoke marketing header).

## Optional follow-up (not in scope unless you want it)

Some sections (hero text, how-it-works) may look stretched at very wide viewports. If you'd rather cap to the same width Marketplace uses internally (which is also edge-to-edge in fullWidth mode, so effectively uncapped), let me know and I can instead use `max-w-7xl` (1280px) as a middle ground.

## Technical details

```diff
- <div className="max-w-6xl mx-auto px-6 h-14 ...">
+ <div className="px-4 sm:px-6 h-14 ...">
```
Applied to all 10 wrappers. No other code touched.