-- Revoke billing_email from authenticated role on user_subscriptions.
-- Billing data is owned by Stripe — this column should never be readable
-- by anyone other than the service role (which handles webhook processing).
-- The existing RLS already prevents creators from reading subscriber rows,
-- but column-level revocation adds a second layer of defence.
REVOKE SELECT (billing_email) ON public.user_subscriptions FROM authenticated;
