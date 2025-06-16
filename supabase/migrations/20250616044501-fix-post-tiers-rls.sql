
-- Simplify post_tiers RLS policies to avoid recursion
DROP POLICY IF EXISTS "Creators can manage their post tiers" ON public.post_tiers;
DROP POLICY IF EXISTS "Users can view post tiers" ON public.post_tiers;

-- Allow creators to manage tiers for their own posts
CREATE POLICY "Creators can manage post tiers" 
ON public.post_tiers 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_tiers.post_id
    AND p.author_id = auth.uid()
  )
);

-- Allow users to view post tier relationships for posts they can access
CREATE POLICY "Users can view accessible post tiers" 
ON public.post_tiers 
FOR SELECT
USING (
  -- Always allow viewing for the post author
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_tiers.post_id
    AND p.author_id = auth.uid()
  )
  -- Or if user has subscription to this tier
  OR EXISTS (
    SELECT 1 FROM public.user_subscriptions us
    WHERE us.user_id = auth.uid()
    AND us.tier_id = post_tiers.tier_id
    AND us.status = 'active'
    AND (us.current_period_end IS NULL OR us.current_period_end > now())
  )
);
