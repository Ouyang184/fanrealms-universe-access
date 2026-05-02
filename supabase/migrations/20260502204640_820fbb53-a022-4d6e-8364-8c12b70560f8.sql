
-- Fix 1: posts RLS — replace broken self-referential post_tiers checks
DROP POLICY IF EXISTS "Anyone can view non-gated published posts" ON public.posts;
CREATE POLICY "Anyone can view non-gated published posts"
  ON public.posts FOR SELECT
  USING (
    status = 'published'
    AND (scheduled_for IS NULL OR scheduled_for <= now())
    AND NOT EXISTS (
      SELECT 1 FROM public.post_tiers pt WHERE pt.post_id = posts.id
    )
    AND tier_id IS NULL
  );

DROP POLICY IF EXISTS "Subscribers can view tier-gated posts" ON public.posts;
CREATE POLICY "Subscribers can view tier-gated posts"
  ON public.posts FOR SELECT
  USING (
    status = 'published'
    AND (scheduled_for IS NULL OR scheduled_for <= now())
    AND (
      (tier_id IS NOT NULL AND public.user_has_tier_access(tier_id))
      OR EXISTS (
        SELECT 1 FROM public.post_tiers pt
        WHERE pt.post_id = posts.id
          AND public.user_has_tier_access(pt.tier_id)
      )
    )
  );

-- Fix 2: post_tiers — separate owner write access from subscriber read access
DROP POLICY IF EXISTS "Consolidated post tiers access" ON public.post_tiers;

CREATE POLICY "Post owners manage tier assignments"
  ON public.post_tiers FOR ALL
  USING (public.user_owns_post(post_id))
  WITH CHECK (public.user_owns_post(post_id));

CREATE POLICY "Subscribers and owners can view tier assignments"
  ON public.post_tiers FOR SELECT
  USING (public.user_owns_post(post_id) OR public.user_has_tier_access(tier_id));
