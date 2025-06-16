
-- Drop ALL existing policies on posts and post_tiers tables
DROP POLICY IF EXISTS "Users can view their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view public posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view posts with legacy tier access" ON public.posts;
DROP POLICY IF EXISTS "Users can view posts with multi-tier access" ON public.posts;
DROP POLICY IF EXISTS "Users can manage their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view posts with access" ON public.posts;
DROP POLICY IF EXISTS "Creators can manage their posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view multi-tier posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view subscribed tier posts" ON public.posts;

DROP POLICY IF EXISTS "Users can manage their post tiers" ON public.post_tiers;
DROP POLICY IF EXISTS "Users can view post tiers they have access to" ON public.post_tiers;
DROP POLICY IF EXISTS "Creators can manage post tiers" ON public.post_tiers;
DROP POLICY IF EXISTS "Users can view accessible post tiers" ON public.post_tiers;
DROP POLICY IF EXISTS "Users can view post tiers" ON public.post_tiers;
DROP POLICY IF EXISTS "Creators can manage their post tiers" ON public.post_tiers;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.user_has_tier_access(tier_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_subscriptions us
    WHERE us.user_id = auth.uid()
    AND us.tier_id = tier_id_param
    AND us.status = 'active'
    AND (us.current_period_end IS NULL OR us.current_period_end > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_owns_post(post_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_id_param
    AND p.author_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create non-recursive RLS policies for posts
CREATE POLICY "Users can view their own posts" 
ON public.posts 
FOR SELECT 
USING (auth.uid() = author_id);

CREATE POLICY "Users can view public posts" 
ON public.posts 
FOR SELECT 
USING (tier_id IS NULL);

CREATE POLICY "Users can view posts with legacy tier access" 
ON public.posts 
FOR SELECT 
USING (
  tier_id IS NOT NULL 
  AND public.user_has_tier_access(tier_id)
);

CREATE POLICY "Users can view posts with multi-tier access" 
ON public.posts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.post_tiers pt
    WHERE pt.post_id = posts.id
    AND public.user_has_tier_access(pt.tier_id)
  )
);

-- Policy for creating/updating posts
CREATE POLICY "Users can manage their own posts" 
ON public.posts 
FOR ALL
USING (auth.uid() = author_id);

-- Create non-recursive RLS policies for post_tiers
CREATE POLICY "Users can manage their post tiers" 
ON public.post_tiers 
FOR ALL
USING (public.user_owns_post(post_id));

CREATE POLICY "Users can view post tiers they have access to" 
ON public.post_tiers 
FOR SELECT
USING (
  public.user_owns_post(post_id)
  OR public.user_has_tier_access(tier_id)
);
