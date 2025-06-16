
-- Add a new table to handle many-to-many relationship between posts and tiers
CREATE TABLE public.post_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.membership_tiers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, tier_id)
);

-- Enable RLS on the new table
ALTER TABLE public.post_tiers ENABLE ROW LEVEL SECURITY;

-- Allow creators to manage their post tiers
CREATE POLICY "Creators can manage their post tiers" 
ON public.post_tiers 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_tiers.post_id
    AND p.author_id = auth.uid()
  )
);

-- Allow users to view post tiers for posts they have access to
CREATE POLICY "Users can view post tiers" 
ON public.post_tiers 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_tiers.post_id
    AND (
      p.author_id = auth.uid() -- Creator can see their own
      OR p.tier_id IS NULL -- Public posts
      OR EXISTS (
        SELECT 1 FROM public.user_subscriptions us
        WHERE us.user_id = auth.uid()
        AND us.tier_id = post_tiers.tier_id
        AND us.status = 'active'
      )
    )
  )
);

-- Update the posts RLS policy to handle multiple tiers
DROP POLICY IF EXISTS "Users can view subscribed tier posts" ON public.posts;

CREATE POLICY "Users can view multi-tier posts" 
ON public.posts 
FOR SELECT 
USING (
  tier_id IS NULL -- Public posts
  OR auth.uid() = author_id -- Creator's own posts
  OR EXISTS (
    SELECT 1 FROM public.post_tiers pt
    JOIN public.user_subscriptions us ON us.tier_id = pt.tier_id
    WHERE pt.post_id = posts.id
    AND us.user_id = auth.uid()
    AND us.status = 'active'
    AND (us.current_period_end IS NULL OR us.current_period_end > now())
  )
);
