-- ============================================================
-- Warning 1: Gate NSFW posts behind age_verified = true
-- ============================================================

-- Replace the blanket "anyone can view non-gated published posts"
-- policy so that is_nsfw=true posts are excluded for unverified users.
DROP POLICY IF EXISTS "Anyone can view non-gated published posts" ON public.posts;

CREATE POLICY "Anyone can view non-NSFW public posts"
ON public.posts FOR SELECT USING (
  status = 'published'
  AND (scheduled_for IS NULL OR scheduled_for <= now())
  AND NOT EXISTS (SELECT 1 FROM post_tiers pt WHERE pt.post_id = posts.id)
  AND tier_id IS NULL
  AND (is_nsfw IS NULL OR is_nsfw = false)
);

CREATE POLICY "Age-verified users can view NSFW public posts"
ON public.posts FOR SELECT USING (
  status = 'published'
  AND (scheduled_for IS NULL OR scheduled_for <= now())
  AND NOT EXISTS (SELECT 1 FROM post_tiers pt WHERE pt.post_id = posts.id)
  AND tier_id IS NULL
  AND is_nsfw = true
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.age_verified = true
  )
);

-- Also gate NSFW tier-gated posts behind age_verified.
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
      WHERE u.id = auth.uid() AND u.age_verified = true
    )
  )
);

-- ============================================================
-- Warning 2: Server-side age verification validation
-- ============================================================

-- Trigger: prevent setting age_verified = true without a valid DOB (18+ years ago).
CREATE OR REPLACE FUNCTION public.enforce_age_verification_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only block when age_verified is being flipped ON
  IF NEW.age_verified = true AND (OLD.age_verified IS NULL OR OLD.age_verified = false) THEN
    IF NEW.date_of_birth IS NULL
       OR NEW.date_of_birth > CURRENT_DATE - INTERVAL '18 years' THEN
      RAISE EXCEPTION 'date_of_birth must be at least 18 years in the past to enable age verification';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_age_verification ON public.users;
CREATE TRIGGER enforce_age_verification
  BEFORE UPDATE OF age_verified ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_age_verification_on_update();

-- SECURITY DEFINER RPC: client calls this to submit DOB and get age_verified set atomically.
-- Because it runs as the function owner (postgres), it can bypass RLS to update the row,
-- but it explicitly validates the caller's uid() so it can only update the caller's own row.
CREATE OR REPLACE FUNCTION public.verify_age_with_dob(p_date_of_birth date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_date_of_birth IS NULL
     OR p_date_of_birth > CURRENT_DATE - INTERVAL '18 years' THEN
    RETURN jsonb_build_object('success', false, 'error', 'You must be 18 or older to enable NSFW content');
  END IF;

  UPDATE public.users
  SET age_verified  = true,
      date_of_birth = p_date_of_birth
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_age_with_dob(date) TO authenticated;

-- ============================================================
-- Warning 3: Revoke raw download fields from anon & authenticated
-- ============================================================

-- Both columns are now read via the get-download-url Edge Function (service role).
-- Revoking column-level SELECT means SELECT * silently omits these fields for
-- unprivileged roles, and explicit SELECT asset_url returns permission denied.
REVOKE SELECT (asset_url, asset_file_path) ON public.digital_products FROM anon;
REVOKE SELECT (asset_url, asset_file_path) ON public.digital_products FROM authenticated;

-- SECURITY DEFINER function for the creator dashboard — returns the full product row
-- (including asset_url and asset_file_path) but only if the caller owns the product.
CREATE OR REPLACE FUNCTION public.get_creator_product(p_product_id uuid)
RETURNS TABLE (
  id               uuid,
  creator_id       uuid,
  title            text,
  description      text,
  short_description text,
  price            numeric,
  category         text,
  tags             text[],
  cover_image_url  text,
  asset_url        text,
  asset_file_path  text,
  trailer_url      text,
  screenshots      text[],
  version          text,
  license          text,
  godot_version    text,
  project_id       uuid,
  status           text,
  stripe_price_id  text,
  created_at       timestamptz,
  updated_at       timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.creator_id, p.title, p.description,
    p.short_description, p.price, p.category, p.tags,
    p.cover_image_url, p.asset_url, p.asset_file_path,
    p.trailer_url, p.screenshots, p.version, p.license,
    p.godot_version, p.project_id, p.status, p.stripe_price_id,
    p.created_at, p.updated_at
  FROM public.digital_products p
  JOIN public.creators c ON c.id = p.creator_id
  WHERE p.id = p_product_id
    AND c.user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_creator_product(uuid) TO authenticated;
