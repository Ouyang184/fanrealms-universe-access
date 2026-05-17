
-- Hide job_listings.contact_info from anonymous visitors
REVOKE SELECT (contact_info) ON public.job_listings FROM anon;
GRANT SELECT (contact_info) ON public.job_listings TO authenticated;

-- Add DELETE policy on commission-deliverables storage objects.
-- Path convention: <creator_user_id>/<commission_request_id>/<filename>
DROP POLICY IF EXISTS "Creators can delete their commission deliverables" ON storage.objects;
CREATE POLICY "Creators can delete their commission deliverables"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'commission-deliverables'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1
    FROM public.commission_requests cr
    JOIN public.creators c ON c.id = cr.creator_id
    WHERE c.user_id = auth.uid()
      AND cr.id::text = (storage.foldername(name))[2]
  )
);
