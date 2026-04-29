CREATE POLICY "post_attachments_owner_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'post-attachments'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);