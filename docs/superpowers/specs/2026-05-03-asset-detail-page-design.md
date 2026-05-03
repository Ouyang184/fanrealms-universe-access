# Asset Management Page Design

**Date:** 2026-05-03  
**Status:** Approved

---

## Goal

Give every creator a dedicated full-page management view for each of their assets at `/dashboard/assets/:id`, matching itch.io's pattern. Replace the current edit dialog with proper page navigation.

---

## Routes

| Route | Page | Notes |
|---|---|---|
| `/dashboard/assets` | List (existing) | Each row links to detail page instead of opening dialog |
| `/dashboard/assets/new` | New asset form | Same form, empty state |
| `/dashboard/assets/:id` | Asset management page | Edit + stats |

---

## Page Layout: `/dashboard/assets/:id`

Two-column on desktop (`grid-cols-[1fr_280px]`), stacked on mobile.

### Left — Edit Form

Full edit form (content currently in `AssetFormDialog`, now a page):

| Field | Type | Notes |
|---|---|---|
| Cover image | File upload | 16:9, max 5MB, jpg/png/webp/gif |
| Title | Text input | Required |
| Tagline | Text input | 120 char max, shown on listing cards |
| Full description | Textarea | Shown on product page |
| Screenshots | URL inputs (up to 5) | Add/remove rows |
| Category | Select | All 11 Godot categories |
| Godot version | Select | Godot 4.3+, 4.2, 4.1, 4.0, 3.x, Any |
| Price (USD) | Number input | 0 = free |
| Version | Text input | e.g. 1.0.0 |
| License | Select | Standard, CC BY, CC BY-SA, MIT, Public Domain |
| Tags | Text input | Comma-separated |
| Download URL | URL input | Shown to buyers only after purchase/free download |
| Status | Toggle | Draft / Published |

**Save button** — calls `useUpdateProduct()`, shows toast on success/error.

### Right Sidebar — Stats + Actions

Sticky on desktop (`lg:sticky lg:top-20`).

**Stats card:**
- Total sales (count of completed purchases for this product)
- Net revenue (sum of `net_amount` from purchases for this product)
- Formatted as: `$0.00` with "No sales yet" empty state

**Actions card:**
- "View public page →" — `Link` to `/marketplace/:id`, opens in same tab
- "Delete asset" — red button, opens `AlertDialog` confirmation, on confirm calls `useDeleteProduct()` then navigates to `/dashboard/assets`

**Back link** at the top of the page: `← Your assets` navigates to `/dashboard/assets`.

---

## `/dashboard/assets/new`

Same layout as the edit page but:
- All fields empty
- Title: "New asset"
- Save calls `useCreateProduct()` instead of `useUpdateProduct()`
- On success: navigate to `/dashboard/assets/:newId` (use the returned product ID)
- No stats sidebar (asset doesn't exist yet) — sidebar shows "Save your asset to see stats"

---

## `/dashboard/assets` List Changes

- Each asset row: clicking the title or a new "Manage →" link navigates to `/dashboard/assets/:id`
- Remove the `Pencil` edit button that opened `AssetFormDialog`
- Remove `AssetFormDialog` import from `DashboardAssetsPage`
- "New asset" button navigates to `/dashboard/assets/new` instead of opening dialog
- Keep the `Trash2` delete button inline (with `AlertDialog`) for quick delete from list

---

## Data Sources

| Data | Hook | Notes |
|---|---|---|
| Asset details | `useProduct(id)` | Public hook — already exists |
| Update asset | `useUpdateProduct()` | Already exists |
| Create asset | `useCreateProduct()` | Already exists |
| Delete asset | `useDeleteProduct()` | Already exists |
| Per-asset sales | `useSellerSales()` filtered by `product_id === id` | Filter client-side from existing hook |
| Cover image upload | Supabase storage `product-images` bucket | Same logic as AssetFormDialog |

---

## Error States

| Scenario | Behaviour |
|---|---|
| Product not found (bad ID) | Show "Asset not found" with link back to `/dashboard/assets` |
| Product belongs to different creator | Same as not found — don't leak existence |
| Save fails | Toast error, form stays editable |
| Delete fails | Toast error, no navigation |
| Loading | Skeleton placeholders for form fields and stats |

---

## Files Changed

| File | Action |
|---|---|
| `src/pages/DashboardAssetDetail.tsx` | **Create** — edit form + stats page |
| `src/pages/DashboardAssets.tsx` | **Modify** — remove dialog, add navigation links |
| `src/App.tsx` | **Modify** — add `/dashboard/assets/new` and `/dashboard/assets/:id` routes |

---

## Out of Scope

- View counts / download analytics (no data source exists yet)
- Screenshot file upload (still URL-based — file upload is a future feature)
- Buyer list per asset (future feature)
- Asset versioning / changelog
