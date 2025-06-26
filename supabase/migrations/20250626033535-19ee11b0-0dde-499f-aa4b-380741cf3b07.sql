
-- Final consolidation of posts policies into single optimized policies

-- Remove all remaining overlapping posts policies
DROP POLICY IF EXISTS "Optimized NSFW filter" ON public.posts;
DROP POLICY IF EXISTS "Optimized posts read access" ON public.posts;
DROP POLICY IF EXISTS "Optimized posts write access" ON public.posts;

-- Create a single, comprehensive SELECT policy that handles everything
CREATE POLICY "Unified posts read access" ON public.posts
  FOR SELECT USING (
    -- Always show if user owns the post
    (SELECT auth.uid()) = author_id
    OR
    -- For non-NSFW posts: show if public OR user has tier access
    (
      is_nsfw = false 
      AND (
        tier_id IS NULL 
        OR public.user_has_tier_access(tier_id)
        OR EXISTS (
          SELECT 1 FROM public.post_tiers pt
          WHERE pt.post_id = posts.id
          AND public.user_has_tier_access(pt.tier_id)
        )
      )
    )
    OR
    -- For NSFW posts: show only if user has NSFW enabled AND (public OR has tier access)
    (
      is_nsfw = true 
      AND EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = (SELECT auth.uid()) 
        AND u.is_nsfw_enabled = true
      )
      AND (
        tier_id IS NULL 
        OR public.user_has_tier_access(tier_id)
        OR EXISTS (
          SELECT 1 FROM public.post_tiers pt
          WHERE pt.post_id = posts.id
          AND public.user_has_tier_access(pt.tier_id)
        )
      )
    )
  );

-- Create a single write policy for all write operations
CREATE POLICY "Unified posts write access" ON public.posts
  FOR ALL USING ((SELECT auth.uid()) = author_id)
  WITH CHECK ((SELECT auth.uid()) = author_id);
