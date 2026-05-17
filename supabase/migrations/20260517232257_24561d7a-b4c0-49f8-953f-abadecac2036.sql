
-- 1) Hide job_listings.contact_info from anonymous visitors using
--    explicit column-level grants (table-level SELECT also covers
--    column SELECT, so we must revoke at table level then re-grant
--    every column except contact_info to anon).
REVOKE SELECT ON public.job_listings FROM anon;
GRANT SELECT (
  id, poster_id, title, category, description, requirements,
  budget_type, budget_min, budget_max, tags, status, deadline,
  created_at, updated_at
) ON public.job_listings TO anon;
-- authenticated keeps full table SELECT (incl. contact_info)
GRANT SELECT ON public.job_listings TO authenticated;

-- 2) Hide Stripe identifiers on purchases from end users. RLS can't
--    filter columns, so we revoke column SELECT from authenticated.
--    Service role (edge functions / webhooks) retains access.
REVOKE SELECT (stripe_payment_intent_id, stripe_session_id)
  ON public.purchases FROM authenticated;
REVOKE SELECT (stripe_payment_intent_id, stripe_session_id)
  ON public.purchases FROM anon;

-- 3) Tighten commission-deliverables upload policy: also verify the
--    commission_request_id in the second path segment belongs to a
--    commission owned by the uploading creator.
DROP POLICY IF EXISTS "Creators can upload deliverables" ON storage.objects;
CREATE POLICY "Creators can upload deliverables"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
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

-- Same tightening for UPDATE on existing deliverable objects.
DROP POLICY IF EXISTS "Creators can update their commission deliverables" ON storage.objects;
CREATE POLICY "Creators can update their commission deliverables"
ON storage.objects
FOR UPDATE
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
)
WITH CHECK (
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
