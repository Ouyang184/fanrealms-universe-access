DROP POLICY IF EXISTS "Authenticated users can upload jam entries" ON storage.objects;

CREATE POLICY "Authenticated users can upload jam entries"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'jam-entries'
  AND auth.uid()::text = (storage.foldername(name))[2]
);