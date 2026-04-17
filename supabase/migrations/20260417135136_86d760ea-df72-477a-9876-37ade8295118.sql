
-- Drop existing insecure write policies on storage.objects for post-attachments
DROP POLICY IF EXISTS "post_attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "post_attachments_update" ON storage.objects;
DROP POLICY IF EXISTS "post_attachments_delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload post attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update post attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete post attachments" ON storage.objects;
DROP POLICY IF EXISTS "post_attachments_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "post_attachments_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "post_attachments_authenticated_delete" ON storage.objects;

-- Authors organize their files under a path beginning with their own user id:
--   `${user.id}/...` (see useCreatePost.ts uploadFile)
-- Restrict writes to the bucket so the first path segment matches auth.uid().
CREATE POLICY "post_attachments_owner_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "post_attachments_owner_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'post-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "post_attachments_owner_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
