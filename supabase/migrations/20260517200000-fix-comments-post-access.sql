-- Fix: comments on tier-gated posts were visible to non-subscribers.
--
-- Previous policy: USING (true) — anyone could read all comments.
-- New policy mirrors the posts SELECT logic:
--   1. Comment author always sees their own comments.
--   2. Free, non-NSFW, non-gated post → public access.
--   3. Post author sees all comments on their own posts.
--   4. Tier-gated non-NSFW post → subscriber only (user_has_tier_access).
--   5. NSFW free post → age-verified + NSFW-enabled users.
--   6. NSFW tier-gated post → subscriber AND age-verified + NSFW-enabled.

DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;

CREATE POLICY "Users can view comments on accessible posts" ON public.comments
FOR SELECT USING (
  -- Always: comment author sees their own comments
  (select auth.uid()) = user_id

  OR

  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = comments.post_id
      AND p.status = 'published'
      AND (p.scheduled_for IS NULL OR p.scheduled_for <= now())
      AND (
        -- Case 1: free, non-NSFW, non-gated — truly public
        (
          p.tier_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM post_tiers pt WHERE pt.post_id = p.id)
          AND (p.is_nsfw IS NULL OR p.is_nsfw = false)
        )

        -- Case 2: post author can read all comments on their posts
        OR p.author_id = (select auth.uid())

        -- Case 3: tier-gated, non-NSFW → requires subscription
        OR (
          (p.is_nsfw IS NULL OR p.is_nsfw = false)
          AND (
            (p.tier_id IS NOT NULL AND user_has_tier_access(p.tier_id))
            OR EXISTS (
              SELECT 1 FROM post_tiers pt
              WHERE pt.post_id = p.id AND user_has_tier_access(pt.tier_id)
            )
          )
        )

        -- Case 4: NSFW free post → age-verified + opted-in
        OR (
          p.is_nsfw = true
          AND p.tier_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM post_tiers pt WHERE pt.post_id = p.id)
          AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (select auth.uid())
              AND u.age_verified = true
              AND u.is_nsfw_enabled = true
          )
        )

        -- Case 5: NSFW tier-gated post → subscription AND age-verified + opted-in
        OR (
          p.is_nsfw = true
          AND (
            (p.tier_id IS NOT NULL AND user_has_tier_access(p.tier_id))
            OR EXISTS (
              SELECT 1 FROM post_tiers pt
              WHERE pt.post_id = p.id AND user_has_tier_access(pt.tier_id)
            )
          )
          AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (select auth.uid())
              AND u.age_verified = true
              AND u.is_nsfw_enabled = true
          )
        )
      )
  )
);
