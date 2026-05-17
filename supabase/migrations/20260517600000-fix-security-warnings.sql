-- Fix 1: Add DELETE policy on commission_deliverables for creators.
-- Creators should be able to remove deliverable files they uploaded.
CREATE POLICY "Creators can delete their own deliverables"
ON public.commission_deliverables FOR DELETE TO authenticated
USING (
  commission_request_id IN (
    SELECT id FROM public.commission_requests
    WHERE creator_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  )
);

-- Fix 2: Revoke contact_info from the anon role on job_listings.
-- The UI already gates it behind login — enforce the same at DB level
-- so direct API calls by anonymous users don't expose it.
REVOKE SELECT (contact_info) ON public.job_listings FROM anon;
