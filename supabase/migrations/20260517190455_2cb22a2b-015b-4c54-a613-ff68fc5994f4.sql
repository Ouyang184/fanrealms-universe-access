
-- 1) Public can view active membership tiers
DROP POLICY IF EXISTS "Public can view active membership tiers" ON public.membership_tiers;
CREATE POLICY "Public can view active membership tiers"
ON public.membership_tiers
FOR SELECT
TO anon, authenticated
USING (active = true);

-- 2) Tighten storage SELECT on commission-deliverables to active statuses only
DROP POLICY IF EXISTS "Creators and customers can view deliverables" ON storage.objects;
CREATE POLICY "Creators and customers can view deliverables"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'commission-deliverables'
  AND (
    EXISTS (
      SELECT 1 FROM commission_requests cr
      JOIN creators c ON c.id = cr.creator_id
      WHERE c.user_id = auth.uid()
        AND (storage.foldername(objects.name))[2] = cr.id::text
        AND cr.status IN ('accepted', 'in_progress', 'delivered', 'completed', 'revision_requested')
    )
    OR EXISTS (
      SELECT 1 FROM commission_requests cr
      WHERE cr.customer_id = auth.uid()
        AND (storage.foldername(objects.name))[2] = cr.id::text
        AND cr.status IN ('accepted', 'in_progress', 'delivered', 'completed', 'revision_requested')
    )
  )
);
