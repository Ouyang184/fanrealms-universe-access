-- RLS policies for the product-files private storage bucket.
-- Creators may upload/replace/delete files under their own creator_id prefix.
-- No SELECT policy for anon/authenticated — only the service-role Edge Function
-- (get-download-url) reads files, and service role bypasses RLS.

CREATE POLICY "Creators can upload product files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-files'
  AND (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM public.creators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Creators can replace product files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-files'
  AND (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM public.creators WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'product-files'
  AND (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM public.creators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Creators can delete product files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-files'
  AND (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM public.creators WHERE user_id = auth.uid()
  )
);
