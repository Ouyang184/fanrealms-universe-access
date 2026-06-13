-- The cover + banner uploaders (DashboardAssetDetail) write to a
-- 'product-images' bucket that was never created, causing "Bucket not found"
-- when a creator tries to upload a cover. Create it as a public bucket
-- (covers/banners are shown on the public marketplace) with owner-scoped writes.
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read (public display bucket)
DROP POLICY IF EXISTS "product-images public read" ON storage.objects;
CREATE POLICY "product-images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Authenticated creators can upload/update/delete only within their own folder
-- (uploader paths start with the user's id: `${user.id}/...`).
DROP POLICY IF EXISTS "product-images owner insert" ON storage.objects;
CREATE POLICY "product-images owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "product-images owner update" ON storage.objects;
CREATE POLICY "product-images owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "product-images owner delete" ON storage.objects;
CREATE POLICY "product-images owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
