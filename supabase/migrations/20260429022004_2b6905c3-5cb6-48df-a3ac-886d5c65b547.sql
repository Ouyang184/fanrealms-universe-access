
-- 1. Replace overly permissive public SELECT on membership_tiers with a column-safe view via RPC.
-- Drop the old public policy and add a stricter one that excludes Stripe IDs by requiring auth for full row access.
DROP POLICY IF EXISTS "Public can view basic tier information" ON public.membership_tiers;

-- Ensure the safe public RPC exists and returns only non-sensitive columns
CREATE OR REPLACE FUNCTION public.get_public_membership_tiers(p_creator_id uuid)
RETURNS TABLE (
  id uuid,
  creator_id uuid,
  title text,
  description text,
  price numeric,
  active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT mt.id, mt.creator_id, mt.title, mt.description, mt.price, mt.active, mt.created_at, mt.updated_at
  FROM public.membership_tiers mt
  WHERE mt.creator_id = p_creator_id
    AND mt.active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_membership_tiers(uuid) TO anon, authenticated;

-- Keep the existing "Subscribers can view full tier details" policy (owners + active subscribers see Stripe IDs).
-- No public SELECT policy → anonymous users must go through the RPC, which omits stripe_product_id / stripe_price_id.

-- 2. Allow public visibility of creator ratings (reviews) so they are actually readable.
CREATE POLICY "Public can view creator ratings"
ON public.creator_ratings
FOR SELECT
TO anon, authenticated
USING (true);
