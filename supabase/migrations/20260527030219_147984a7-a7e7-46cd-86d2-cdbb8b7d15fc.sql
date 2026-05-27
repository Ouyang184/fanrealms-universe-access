DROP POLICY IF EXISTS "Anyone can read jam entries" ON storage.objects;
CREATE POLICY "Owners can list their jam entries"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'jam-entries'
  AND auth.uid()::text = (storage.foldername(name))[2]
);