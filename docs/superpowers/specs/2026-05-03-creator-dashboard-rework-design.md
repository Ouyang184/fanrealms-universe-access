# Creator Dashboard & Upload Rework Design

**Date:** 2026-05-03  
**Status:** Approved

---

## Goal

Remove the artificial "creator vs buyer" split, give every user immediate access to creator tools, redesign the main dashboard around creation first, and rework the upload form to match itch.io's two-column layout with cleaner pricing and media handling.

---

## Scope

Three connected changes shipped together:

1. **Remove creator gate** — everyone is a creator from day one
2. **Dashboard main page rework** — creation-first layout with stats
3. **Upload form rework** — itch.io-style two-column layout

---

## Part 1: Remove the Creator Gate

### `src/components/dashboard/DashboardLayout.tsx`
- Remove the `isCreator` conditional that hides the CREATE section
- The sidebar's CREATE nav (Dashboard, Projects, Assets, Sales) shows for **all** authenticated users, always
- Remove the `useCreatorProfile` import and call if it's only used for this gate

### `src/pages/Dashboard.tsx`
- Remove the "Become a Creator" banner block (the `!creatorLoading && !isCreator` conditional and its JSX)
- Remove `useCreatorProfile` import if no longer used

### `src/App.tsx` + `src/pages/BecomeCreator.tsx`
- Change the `/become-creator` route to: `<Route path="/become-creator" element={<Navigate to="/dashboard" replace />} />`
- Keep the `BecomeCreator.tsx` file but replace its content with a simple redirect component (or just the Navigate in the route is enough)

---

## Part 2: Dashboard Main Page Rework

Replace `src/pages/Dashboard.tsx` with a creation-first layout.

### Layout

```
[Header: "Dashboard" | username | "Upload an asset" button]

[Stats row: 3 cards]
  - Published assets (count)
  - Total sales (count)  
  - Total earnings (net $)

[Your assets section]
  - ALL assets (published + drafts), not just first 4
  - Each row: cover thumb | title | category | status badge | price | links to /dashboard/assets/:id
  - "New asset" link at bottom of list
  - Empty state: large upload CTA

[Recent sales section — only shown if sales > 0]
  - Last 5 sales: asset name | amount | date
  - "View all →" link to /dashboard/sales

[Your purchases section — at bottom]
  - Same as current
```

### Data
- `useCreatorProducts()` — all assets (no status filter)
- `useSellerSales()` — for stats + recent sales (already available)
- `useUserPurchases()` — purchases section

### Stats computation
From `useSellerSales()`:
```ts
const publishedCount = assets?.filter(a => a.status === 'published').length ?? 0
const salesCount = salesData?.sales.length ?? 0
const totalEarnings = salesData?.totals.net ?? 0
```

---

## Part 3: Upload Form Rework

Rework `src/pages/DashboardAssetDetail.tsx` to use a two-column itch.io-style layout.

### Layout

```
[Back link] [Page title: "New asset" or asset.title]

[Two-column grid: 1fr | 320px sidebar]

LEFT COLUMN                        RIGHT SIDEBAR
─────────────────────────────      ─────────────────────────
Title *                            Cover image (upload button,
                                   16:9, prominent)
Short description / tagline        ─────────────────────────
                                   Trailer URL
Category (What are you             (YouTube / Vimeo link)
uploading?)                        ─────────────────────────
                                   Screenshots
Godot Version                      (up to 5 URL inputs)

Pricing [radio group]:
  ○ Free — anyone downloads
  ○ Paid — [price input $___]
  ○ Name your price — min $___

Download URL
[helper text about Google Drive]

Full description [textarea]

▼ Advanced (collapsible)
  Version, License, Tags

Visibility:
  ○ Draft — only you can see
  ○ Public — visible to all

[Save & view page]  [Save as draft]
```

### Pricing radio group
Three modes stored as a local state `priceMode: 'free' | 'paid' | 'name_your_price'`:

| Mode | `price` saved to DB | Behaviour |
|---|---|---|
| Free | `0` | Download button visible to all |
| Paid | Input value in cents | Stripe checkout required |
| Name your price | Input value as minimum (0 if blank) | Buyer enters amount ≥ minimum |

*Note: "Name your price" uses `price = 0` in the DB for now (same as free) — the suggested minimum is stored in `short_description` or a future `min_price` field. Full implementation can be a follow-up. For this spec, treat it visually but save as `price = 0`.*

### Visibility radio
Replace the current toggle with two clear radio options:
- `draft` — "Only you can see this"
- `published` — "Visible to everyone on the marketplace"

### "Save & view page" button
On save success for an existing published asset: navigate to `/marketplace/:id`. For a draft or new asset: stay on the edit page and show a toast.

### Trailer URL field
New optional field in the sidebar — stored in... check if `digital_products` table has a `trailer_url` column. If not, add it via migration. Displayed on the product detail page below the image gallery.

### Collapsible "Advanced" section
Wrap Version, License, Tags in a `<details>` element or a simple expand/collapse button. These fields are optional and shouldn't intimidate new creators.

---

## Files Changed

| File | Action | Notes |
|---|---|---|
| `src/components/dashboard/DashboardLayout.tsx` | Modify | Remove `isCreator` gate on CREATE section |
| `src/pages/Dashboard.tsx` | Rewrite | Creation-first layout with stats |
| `src/App.tsx` | Modify | `/become-creator` → `<Navigate to="/dashboard">` |
| `src/pages/DashboardAssetDetail.tsx` | Rewrite | Two-column itch.io-style layout |
| `supabase/migrations/` | New | Add `trailer_url` column to `digital_products` |

---

## Out of Scope

- Direct file upload (upload to Supabase storage instead of URL) — separate feature
- Rich text editor for description — separate feature
- "Name your price" full Stripe implementation — follow-up
- Comments/community per asset page — separate feature
- AI generation disclosure field — future addition
