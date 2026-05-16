-- Tighten NSFW gating: require both age_verified AND is_nsfw_enabled
DROP POLICY IF EXISTS "Age-verified users can view NSFW public posts" ON public.posts;

CREATE POLICY "Opted-in age-verified users can view NSFW public posts"
ON public.posts FOR SELECT USING (
  status = 'published'
  AND (scheduled_for IS NULL OR scheduled_for <= now())
  AND NOT EXISTS (SELECT 1 FROM post_tiers pt WHERE pt.post_id = posts.id)
  AND tier_id IS NULL
  AND is_nsfw = true
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.age_verified = true
      AND u.is_nsfw_enabled = true
  )
);

DROP POLICY IF EXISTS "Subscribers can view tier-gated posts" ON public.posts;

CREATE POLICY "Subscribers can view tier-gated posts"
ON public.posts FOR SELECT USING (
  status = 'published'
  AND (scheduled_for IS NULL OR scheduled_for <= now())
  AND (
    (tier_id IS NOT NULL AND user_has_tier_access(tier_id))
    OR EXISTS (
      SELECT 1 FROM post_tiers pt
      WHERE pt.post_id = posts.id AND user_has_tier_access(pt.tier_id)
    )
  )
  AND (
    (is_nsfw IS NULL OR is_nsfw = false)
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.age_verified = true
        AND u.is_nsfw_enabled = true
    )
  )
);