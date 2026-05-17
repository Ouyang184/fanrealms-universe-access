
-- Job listings: hide contact_info from anon
REVOKE SELECT (contact_info) ON public.job_listings FROM anon;

-- Purchases: hide Stripe identifiers from end-user roles
REVOKE SELECT (stripe_payment_intent_id, stripe_session_id)
  ON public.purchases FROM authenticated;
REVOKE SELECT (stripe_payment_intent_id, stripe_session_id)
  ON public.purchases FROM anon;

-- Bundle purchases: hide Stripe session id from end-user roles
REVOKE SELECT (stripe_session_id) ON public.bundle_purchases FROM authenticated;
REVOKE SELECT (stripe_session_id) ON public.bundle_purchases FROM anon;

-- Commission requests: hide Stripe payment intent id from end-user roles
REVOKE SELECT (stripe_payment_intent_id)
  ON public.commission_requests FROM authenticated;
REVOKE SELECT (stripe_payment_intent_id)
  ON public.commission_requests FROM anon;

-- Commission revisions: hide Stripe payment intent id from end-user roles
REVOKE SELECT (stripe_payment_intent_id)
  ON public.commission_revisions FROM authenticated;
REVOKE SELECT (stripe_payment_intent_id)
  ON public.commission_revisions FROM anon;
