-- 1) Drop public read policy on creator_stripe_accounts (exposes Stripe Connect IDs)
DROP POLICY IF EXISTS "creator_stripe_accounts_public_read" ON public.creator_stripe_accounts;

-- 2) Revoke column-level SELECT on Stripe identifiers from client roles
REVOKE SELECT (stripe_session_id) ON public.bundle_purchases FROM anon, authenticated;
REVOKE SELECT (stripe_transfer_id) ON public.creator_earnings FROM anon, authenticated;

-- 3) Add explicit service-role SELECT policy for stripe_customers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'stripe_customers'
      AND policyname = 'Service role can view stripe customers'
  ) THEN
    CREATE POLICY "Service role can view stripe customers"
      ON public.stripe_customers FOR SELECT
      USING (auth.role() = 'service_role');
  END IF;
END $$;