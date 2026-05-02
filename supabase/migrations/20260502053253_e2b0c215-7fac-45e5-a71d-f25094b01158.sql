-- Lock down user_subscriptions to service role only for INSERT/UPDATE
-- Prevents users from forging "active" subscriptions or extending periods without payment
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.user_subscriptions;

-- SELECT (own rows) and the existing service-role ALL policy remain in place.
-- All writes must go through edge functions (which use the service role) after real Stripe payment.