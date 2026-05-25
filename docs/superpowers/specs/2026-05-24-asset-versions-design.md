# Asset Version Updates Design

## Goal
Let creators upload new versions of existing assets without losing purchases or reviews, and show buyers a public changelog.

## Architecture
New `product_versions` table tracks every released version with its file path and release notes. When a new version ships, a row is inserted there AND `digital_products.version` + `digital_products.asset_file_path` are updated to point at the latest file. Buyers always download the current version; the changelog is read-only display on the product page.

## Tech Stack
- Supabase PostgreSQL + Storage (`product-files` bucket, already exists)
- React 18 + TanStack Query
- Existing DashboardAssetDetail pattern for file upload

---

## Data Layer

### New table: `product_versions`

```sql
CREATE TABLE public.product_versions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid        NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  version_number text      NOT NULL,
  release_notes  text      NOT NULL DEFAULT '',
  file_path    text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_versions_product_id_idx ON public.product_versions(product_id);

ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;

-- Anyone can read the changelog
CREATE POLICY "Anyone can view product versions"
  ON public.product_versions FOR SELECT USING (true);

-- Only the product's creator can insert
CREATE POLICY "Creators can insert versions for their products"
  ON public.product_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.digital_products dp
      JOIN public.creators c ON c.id = dp.creator_id
      WHERE dp.id = product_id
        AND c.user_id = auth.uid()
    )
  );

GRANT SELECT ON public.product_versions TO anon, authenticated;
GRANT INSERT ON public.product_versions TO authenticated;
```

### No new columns on `digital_products`
The existing `version` (text) and `asset_file_path` (text) columns are the source of truth for the current version. No schema changes needed there.

---

## Creator flow (Dashboard)

### Location
`src/pages/DashboardAssetDetail.tsx` — editing an existing asset (not `assetId === 'new'`).

### New "Release a new version" collapsible section

Shown only when `!isNew`. Collapsed by default. When expanded, shows:

- **Version number** — text input, placeholder "e.g. 1.1.0"
- **Release notes** — textarea, placeholder "What changed in this version?"
- **New file** — same file picker as the existing asset upload, max 500 MB
- **"Publish update" button** — disabled unless both version number and file are provided

On submit:
1. Upload file to storage: `{creator.id}/{productId}/{assetFile.name}` (upsert: true — replaces any same-name file)
2. Insert into `product_versions`: `{ product_id, version_number, release_notes, file_path }`
3. Update `digital_products`: `{ version: versionNumber, asset_file_path: newFilePath }`
4. Toast: "Version X.X published!"
5. Clear the version panel inputs

### Error handling
- Missing version number → toast "Please enter a version number"
- Missing file → toast "Please select a file to upload"
- Upload failure → toast with error message, do not insert DB row
- DB insert failure → toast "Failed to record version — please try again"

---

## Buyer-facing changelog (Product detail page)

### Location
`src/pages/ProductDetail.tsx` — About tab, below the `ProductRatingsSection`.

### New `ProductChangelog` component
`src/components/marketplace/ProductChangelog.tsx`

```
### Changelog

v1.1.0  ·  May 24, 2026
Fixed tileset alignment, added 3 new sprites.

v1.0.0  ·  May 10, 2026
Initial release.
```

- Fetches `product_versions` ordered by `created_at DESC`
- Only shown when at least one version exists
- If no versions: renders nothing (not even a heading) — works fine for assets uploaded before this feature

### New hook: `useProductVersions(productId)`
`src/hooks/useProductVersions.ts`

```typescript
// useQuery with queryKey ['product-versions', productId]
// SELECT id, version_number, release_notes, created_at
// FROM product_versions WHERE product_id = productId ORDER BY created_at DESC
```

---

## Out of scope
- Version diffing / file diffs
- Buyer notifications for new versions
- Rolling back to a previous version
- Per-version download (buyers always get latest)
- "beta" / release channel flags
