
-- Hide Stripe identifiers and other sensitive columns from client roles via column-level privileges.
-- Service role bypasses these and continues to have full access.

-- commission_requests: hide stripe_payment_intent_id
REVOKE SELECT (stripe_payment_intent_id) ON public.commission_requests FROM anon, authenticated;

-- commission_revisions: hide stripe_payment_intent_id
REVOKE SELECT (stripe_payment_intent_id) ON public.commission_revisions FROM anon, authenticated;

-- digital_products: hide stripe_price_id
REVOKE SELECT (stripe_price_id) ON public.digital_products FROM anon, authenticated;

-- membership_tiers: hide stripe_product_id, stripe_price_id
REVOKE SELECT (stripe_price_id, stripe_product_id) ON public.membership_tiers FROM anon, authenticated;

-- purchases: hide stripe_session_id, stripe_payment_intent_id
REVOKE SELECT (stripe_session_id, stripe_payment_intent_id) ON public.purchases FROM anon, authenticated;

-- stripe_customers: revoke all client SELECT; only service_role should read
REVOKE SELECT ON public.stripe_customers FROM anon, authenticated;
DROP POLICY IF EXISTS "Users can view their own stripe customer data" ON public.stripe_customers;

-- feedback: hide email column from client reads
REVOKE SELECT (email) ON public.feedback FROM anon, authenticated;

-- job_listings: hide contact_info from anonymous users (still readable by authenticated)
REVOKE SELECT (contact_info) ON public.job_listings FROM anon;
