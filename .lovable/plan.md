# Fix "Cover upload failed: new row violates RLS"

## Root cause

The most recent security migration (`20260613041718_…sql`) dropped the `product-images public read` policy from `storage.objects` and never replaced it. The bucket is still flagged `public: true`, so reads through the CDN URL still work — but the upload flow in `AssetFormDialog.uploadCover` calls:

```ts
supabase.storage.from('product-images').upload(path, coverFile, { upsert: true })
```

With `upsert: true`, Supabase Storage needs a `SELECT` policy on `storage.objects` for that bucket so it can look up whether the object already exists before inserting/updating. With no SELECT policy at all, that pre-check fails and storage surfaces the failure as `new row violates row-level security policy`.

The INSERT/UPDATE/DELETE policies are correctly scoped (`auth.uid() = (storage.foldername(name))[1]`) — only the SELECT policy is missing.

## Fix

One new migration that recreates a SELECT policy for the `product-images` bucket, matching the same shape as the other policies on that bucket:

```sql
DROP POLICY IF EXISTS "product-images public read" ON storage.objects;

-- Public bucket: anyone may read objects (matches the bucket's public=true setting
-- and is required for storage upsert to perform its existence pre-check).
CREATE POLICY "product-images public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'product-images');
```

No frontend changes needed. After the migration, cover/banner/screenshot uploads will work again.

## Verification

1. Reload the dashboard, open New Asset, pick a cover image, save → toast should show success, not the RLS error.
2. The uploaded URL should resolve in the marketplace card immediately.
