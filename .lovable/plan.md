## Problem

On `/dashboard/projects/new`, the form is wrapped in `max-w-5xl` (1024px) inside a `<main>` that has no max-width. On wide screens like the current 1037px viewport (and especially wider), this leaves a large empty area on the right of the form card.

## Fix

In `src/pages/DashboardProjectNew.tsx`, drop the `max-w-5xl` constraint on the outer wrapper so the form card stretches to fill the dashboard content area (which is already padded by `DashboardLayout`'s `<main>`).

```text
- <div className="max-w-5xl space-y-6">
+ <div className="space-y-6">
```

The two-column inner grid (`lg:grid-cols-[1fr_280px]`) keeps the cover/media sidebar at a fixed 280px and lets the left column grow naturally — no other layout changes needed.

No other pages are affected.
