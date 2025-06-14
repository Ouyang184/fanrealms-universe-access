
-- Enable RLS on posts table if not already enabled
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view public posts" ON public.posts;
DROP POLICY IF EXISTS "Creators can view their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view posts they have access to" ON public.posts;

-- Policy 1: Allow everyone to view public posts (posts without tier_id)
CREATE POLICY "Users can view public posts" 
ON public.posts 
FOR SELECT 
USING (tier_id IS NULL);

-- Policy 2: Allow creators to view ALL their own posts (including tier-restricted ones)
CREATE POLICY "Creators can view their own posts" 
ON public.posts 
FOR SELECT 
USING (auth.uid() = author_id);

-- Policy 3: Allow users to view tier-restricted posts they have active subscriptions for
CREATE POLICY "Users can view subscribed tier posts" 
ON public.posts 
FOR SELECT 
USING (
  tier_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.user_subscriptions us
    WHERE us.user_id = auth.uid()
    AND us.tier_id = posts.tier_id
    AND us.status = 'active'
    AND (us.current_period_end IS NULL OR us.current_period_end > now())
  )
);

-- Policy 4: Allow creators to insert their own posts
CREATE POLICY "Creators can insert their own posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

-- Policy 5: Allow creators to update their own posts
CREATE POLICY "Creators can update their own posts" 
ON public.posts 
FOR UPDATE 
USING (auth.uid() = author_id);

-- Policy 6: Allow creators to delete their own posts
CREATE POLICY "Creators can delete their own posts" 
ON public.posts 
FOR DELETE 
USING (auth.uid() = author_id);
