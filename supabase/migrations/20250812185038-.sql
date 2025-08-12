-- Tighten membership_tiers SELECT; hide Stripe IDs from public via RPCs

-- Ensure RLS enabled (already is)
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive public SELECT
DROP POLICY IF EXISTS "Anyone can view membership tiers" ON public.membership_tiers;

-- Allow creators to view their own tiers
CREATE POLICY "Creators can view their own membership tiers"
ON public.membership_tiers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.creators c 
    WHERE c.id = membership_tiers.creator_id 
      AND c.user_id = auth.uid()
  )
);

-- Allow subscribers to view tiers they have access to
CREATE POLICY "Subscribers can view tiers they have access to"
ON public.membership_tiers
FOR SELECT
USING (
  public.user_has_tier_access(membership_tiers.id)
);
