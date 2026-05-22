REVOKE SELECT (stripe_account_id) ON public.creator_stripe_accounts FROM anon, authenticated;
REVOKE SELECT (stripe_subscription_id, stripe_customer_id) ON public.user_subscriptions FROM anon, authenticated;
REVOKE SELECT (stripe_price_id, stripe_product_id) ON public.membership_tiers FROM anon, authenticated;
REVOKE SELECT (stripe_session_id) ON public.bundle_purchases FROM anon, authenticated;
REVOKE SELECT (stripe_transfer_id) ON public.creator_earnings FROM anon, authenticated;

DROP VIEW IF EXISTS public.creator_stripe_status;
CREATE VIEW public.creator_stripe_status
  WITH (security_invoker = true) AS
SELECT
  csa.creator_id,
  c.user_id,
  (csa.stripe_account_id IS NOT NULL)             AS is_connected,
  COALESCE(csa.stripe_onboarding_complete, false) AS stripe_onboarding_complete,
  COALESCE(csa.stripe_charges_enabled, false)     AS stripe_charges_enabled,
  COALESCE(csa.stripe_payouts_enabled, false)     AS stripe_payouts_enabled
FROM public.creator_stripe_accounts csa
JOIN public.creators c ON c.id = csa.creator_id;

GRANT SELECT ON public.creator_stripe_status TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_creator_stripe_ready(_creator_id uuid)
RETURNS TABLE (
  is_connected boolean,
  onboarding_complete boolean,
  charges_enabled boolean,
  payouts_enabled boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (csa.stripe_account_id IS NOT NULL),
    COALESCE(csa.stripe_onboarding_complete, false),
    COALESCE(csa.stripe_charges_enabled, false),
    COALESCE(csa.stripe_payouts_enabled, false)
  FROM public.creator_stripe_accounts csa
  WHERE csa.creator_id = _creator_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_creator_stripe_ready(uuid) TO anon, authenticated;