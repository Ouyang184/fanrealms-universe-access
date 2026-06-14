-- Cover/banner/screenshot uploads to product-images were rejected with
-- "new row violates row-level security policy". The write policies used
-- `TO authenticated`, which didn't match in the storage request context.
-- Mirror the working `avatars` bucket exactly: `TO public` with an
-- auth.uid() folder match (the uploader can only write under their own
-- `${user.id}/...` prefix).
DROP POLICY IF EXISTS "product-images owner insert" ON storage.objects;
DROP POLICY IF EXISTS "product-images owner update" ON storage.objects;
DROP POLICY IF EXISTS "product-images owner delete" ON storage.objects;

CREATE POLICY "product-images owner insert" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'product-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "product-images owner update" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'product-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "product-images owner delete" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'product-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
