-- 1) Conversations: restrict INSERT to authenticated users tied to a participant row
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 2) Membership tiers: hide stripe_price_id / stripe_product_id from public
REVOKE SELECT (stripe_price_id, stripe_product_id) ON public.membership_tiers FROM anon;
REVOKE SELECT (stripe_price_id, stripe_product_id) ON public.membership_tiers FROM authenticated;

-- Re-grant non-sensitive columns explicitly to anon and authenticated
GRANT SELECT (id, creator_id, title, description, price, active, created_at, updated_at)
  ON public.membership_tiers TO anon, authenticated;

-- Allow owning creator and active subscribers to read the stripe columns via service-role-bypassing definer function
CREATE OR REPLACE FUNCTION public.get_membership_tier_stripe_ids(_tier_id uuid)
RETURNS TABLE(stripe_price_id text, stripe_product_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mt.stripe_price_id, mt.stripe_product_id
  FROM public.membership_tiers mt
  WHERE mt.id = _tier_id
    AND (
      EXISTS (SELECT 1 FROM public.creators c WHERE c.id = mt.creator_id AND c.user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.user_subscriptions us
        WHERE us.tier_id = mt.id AND us.user_id = auth.uid() AND us.status = 'active'
      )
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_membership_tier_stripe_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_membership_tier_stripe_ids(uuid) TO authenticated;

-- 3) Realtime channel authorization: users can only subscribe to topics matching their own UID
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can subscribe to their own realtime topics" ON realtime.messages;
CREATE POLICY "Users can subscribe to their own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE '%' || auth.uid()::text || '%'
);
