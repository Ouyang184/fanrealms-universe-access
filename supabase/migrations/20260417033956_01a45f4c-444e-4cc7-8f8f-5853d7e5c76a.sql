
-- ============================================================
-- 1) Move Stripe fields off public creators table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.creator_stripe_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL UNIQUE REFERENCES public.creators(id) ON DELETE CASCADE,
  stripe_account_id text,
  stripe_onboarding_complete boolean DEFAULT false,
  stripe_charges_enabled boolean DEFAULT false,
  stripe_payouts_enabled boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Backfill from creators table
INSERT INTO public.creator_stripe_accounts (creator_id, stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled)
SELECT id, stripe_account_id, COALESCE(stripe_onboarding_complete, false), COALESCE(stripe_charges_enabled, false), COALESCE(stripe_payouts_enabled, false)
FROM public.creators
WHERE stripe_account_id IS NOT NULL
ON CONFLICT (creator_id) DO NOTHING;

ALTER TABLE public.creator_stripe_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their stripe account"
  ON public.creator_stripe_accounts FOR SELECT
  TO authenticated
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

CREATE POLICY "Service role manages stripe accounts"
  ON public.creator_stripe_accounts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Backward-compatible view for the UI to read the owner's own status flags
CREATE OR REPLACE VIEW public.creator_stripe_status
WITH (security_invoker = true)
AS
SELECT
  csa.creator_id,
  c.user_id,
  csa.stripe_account_id,
  csa.stripe_onboarding_complete,
  csa.stripe_charges_enabled,
  csa.stripe_payouts_enabled
FROM public.creator_stripe_accounts csa
JOIN public.creators c ON c.id = csa.creator_id;

-- Drop sensitive columns from public creators table
ALTER TABLE public.creators
  DROP COLUMN IF EXISTS stripe_account_id,
  DROP COLUMN IF EXISTS stripe_onboarding_complete,
  DROP COLUMN IF EXISTS stripe_charges_enabled,
  DROP COLUMN IF EXISTS stripe_payouts_enabled;

-- ============================================================
-- 2) Lock down post-attachments storage with tier-gated access
-- ============================================================

UPDATE storage.buckets SET public = false WHERE id = 'post-attachments';

-- Helper to check if a user can read a given attachment object
CREATE OR REPLACE FUNCTION public.can_read_post_attachment(_user_id uuid, _object_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _post_id uuid;
  _author_id uuid;
  _creator_user_id uuid;
  _tier_id uuid;
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Convention: object path begins with the post id, e.g. "<post_id>/filename.png"
  BEGIN
    _post_id := split_part(_object_name, '/', 1)::uuid;
  EXCEPTION WHEN others THEN
    RETURN false;
  END;

  SELECT p.author_id, p.tier_id, c.user_id
    INTO _author_id, _tier_id, _creator_user_id
  FROM public.posts p
  LEFT JOIN public.creators c ON c.id = p.creator_id
  WHERE p.id = _post_id;

  IF _author_id IS NULL THEN
    RETURN false;
  END IF;

  -- Author or owning creator can always read
  IF _author_id = _user_id OR _creator_user_id = _user_id THEN
    RETURN true;
  END IF;

  -- Free post (no tier required)
  IF _tier_id IS NULL THEN
    RETURN true;
  END IF;

  -- Active subscription to the required tier
  RETURN EXISTS (
    SELECT 1 FROM public.user_subscriptions us
    WHERE us.user_id = _user_id
      AND us.tier_id = _tier_id
      AND us.status = 'active'
      AND (us.current_period_end IS NULL OR us.current_period_end > now())
  );
END;
$$;

-- Remove permissive existing SELECT policies on this bucket and replace with gated one
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual ILIKE '%post-attachments%' OR with_check ILIKE '%post-attachments%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authorized users can read post attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'post-attachments'
    AND public.can_read_post_attachment(auth.uid(), name)
  );

CREATE POLICY "Post authors can upload attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-attachments'
    AND public.can_read_post_attachment(auth.uid(), name)
  );

CREATE POLICY "Post authors can update their attachments"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'post-attachments'
    AND public.can_read_post_attachment(auth.uid(), name)
  );

CREATE POLICY "Post authors can delete their attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-attachments'
    AND public.can_read_post_attachment(auth.uid(), name)
  );
