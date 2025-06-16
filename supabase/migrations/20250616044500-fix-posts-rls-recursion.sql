
-- Fix the infinite recursion issue in posts RLS policy
DROP POLICY IF EXISTS "Users can view multi-tier posts" ON public.posts;

-- Create a simpler, non-recursive policy for posts
CREATE POLICY "Users can view posts with access" 
ON public.posts 
FOR SELECT 
USING (
  -- Public posts (no tier restriction)
  tier_id IS NULL 
  -- Creator's own posts
  OR auth.uid() = author_id 
  -- Posts with legacy single tier access
  OR (
    tier_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.user_id = auth.uid()
      AND us.tier_id = posts.tier_id
      AND us.status = 'active'
      AND (us.current_period_end IS NULL OR us.current_period_end > now())
    )
  )
  -- Posts with multiple tier access
  OR EXISTS (
    SELECT 1 FROM public.post_tiers pt
    WHERE pt.post_id = posts.id
    AND EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.user_id = auth.uid()
      AND us.tier_id = pt.tier_id
      AND us.status = 'active'
      AND (us.current_period_end IS NULL OR us.current_period_end > now())
    )
  )
);

-- Ensure creators can manage their own posts
CREATE POLICY "Creators can manage their posts" 
ON public.posts 
FOR ALL
USING (auth.uid() = author_id);
