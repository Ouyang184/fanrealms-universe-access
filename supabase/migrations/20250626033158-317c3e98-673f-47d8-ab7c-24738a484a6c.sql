
-- Complete cleanup of all remaining duplicate policies

-- Remove all remaining duplicate posts policies
DROP POLICY IF EXISTS "Anyone can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view posts with legacy tier access" ON public.posts;
DROP POLICY IF EXISTS "Users can view posts with multi-tier access" ON public.posts;
DROP POLICY IF EXISTS "Users can view public posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view public posts or subscribed tier posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can manage their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts as creators" ON public.posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Hide NSFW posts from users with NSFW disabled" ON public.posts;

-- Remove duplicate message policies
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;

-- Remove duplicate post_views policies
DROP POLICY IF EXISTS "Users can view all post views" ON public.post_views;

-- Recreate the optimized NSFW policy with correct syntax
CREATE POLICY "Optimized NSFW filter" ON public.posts
  FOR SELECT USING (
    -- Show all non-NSFW posts
    is_nsfw = false 
    OR 
    -- Show NSFW posts only if user has NSFW enabled or is the author
    (
      is_nsfw = true 
      AND (
        (SELECT auth.uid()) = author_id  -- Author can always see their own posts
        OR 
        EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = (SELECT auth.uid()) 
          AND u.is_nsfw_enabled = true
        )
      )
    )
  );

-- Drop the overlapping post_tiers management policy since it's redundant
DROP POLICY IF EXISTS "Optimized post tiers management" ON public.post_tiers;

-- Update the remaining post_tiers policy to handle both read and write
DROP POLICY IF EXISTS "Optimized post tiers access" ON public.post_tiers;

CREATE POLICY "Consolidated post tiers access" ON public.post_tiers
  FOR ALL USING (
    public.user_owns_post(post_id)
    OR public.user_has_tier_access(tier_id)
  );
