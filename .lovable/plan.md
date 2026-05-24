# Plan: Asset Versions & Creator Profile Category Filter

## Feature 1 — Asset version updates + changelog

### Database (migration)
New table `public.product_versions`:
- `id` uuid pk
- `product_id` uuid → `digital_products.id` on delete cascade
- `version_number` text not null
- `release_notes` text
- `file_path` text not null (storage path in the product assets bucket)
- `created_at` timestamptz default now()
- Index on `(product_id, created_at desc)`

RLS:
- Enable RLS.
- SELECT public: rows are readable when the parent `digital_products` row is `status = 'published'` (so buyers can read changelog) OR the caller owns the product (creator preview).
- INSERT/UPDATE/DELETE only by the owning creator (`creator_id` of parent product matches `creators.user_id = auth.uid()`).

No changes to `digital_products` columns — we already have `version` and `asset_file_path` and will continue updating them when a new version ships.

### Creator dashboard — `src/pages/DashboardAssetDetail.tsx`
- Add a `<Collapsible>` panel below the existing file upload section, only when editing an existing asset (skip on "new").
- Title: "Release a new version".
- Fields: version number (Input), release notes (Textarea), file picker (reuse existing direct-upload helper used elsewhere on this page).
- "Publish update" button:
  1. Uploads file via the existing storage helper, gets the new `file_path`.
  2. Inserts row into `product_versions` (`product_id`, `version_number`, `release_notes`, `file_path`).
  3. Calls `useUpdateProduct` to set `version` and `asset_file_path` to the new values.
  4. Invalidates `['product-versions', productId]` and existing product queries; toasts success; resets the panel.
- New hook `src/hooks/useProductVersions.ts` exporting `useProductVersions(productId)` (list) and `usePublishProductVersion()` (mutation that wraps upload + insert + product update).

### Product page — `src/pages/ProductDetail.tsx`
- Below the existing ratings section, add a `Changelog` section.
- Uses `useProductVersions(productId)`; lists newest-first.
- Each entry: version number (bold), date (`formatDistanceToNow`), release notes (preserve newlines).
- If the list has 0 or 1 entries, render nothing (per spec: "Empty if only one version exists").

### Types
After the migration runs, `src/integrations/supabase/types.ts` will be regenerated automatically.

---

## Feature 2 — Category filter on creator profile

Pure frontend, in `src/pages/SellerProfile.tsx`:
- Derive `categories` from `products` via `Array.from(new Set(products.map(p => p.category).filter(Boolean)))`.
- Local state `selectedCategory: string` defaulting to `'all'`.
- Render a row of chip buttons above the Assets grid: `All` + one chip per derived category. Hide the row entirely if there are 0 or 1 categories.
- Filter `products` by `selectedCategory` before mapping to `<ProductCard />`.
- Chip styling matches existing minimal aesthetic (pill, `border-[#eee]`, active state uses `bg-primary text-white`).

No backend, no hook changes.

---

## Out of scope
- No download-URL changes; buyers continue to download the current `asset_file_path` (the latest version). Per-version downloads from the changelog can be a follow-up.
- No notifications to buyers on new version (follow-up).

Confirm and I'll build both.