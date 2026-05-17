
-- Hide Stripe internal identifiers on membership_tiers from anon
REVOKE SELECT (stripe_product_id, stripe_price_id)
  ON public.membership_tiers FROM anon;

-- Hide Stripe identifiers and billing email on user_subscriptions
-- from end users (both anon and the owning authenticated user).
-- Service role keeps full access for webhooks/edge functions.
REVOKE SELECT (stripe_subscription_id, stripe_customer_id, billing_email)
  ON public.user_subscriptions FROM authenticated;
REVOKE SELECT (stripe_subscription_id, stripe_customer_id, billing_email)
  ON public.user_subscriptions FROM anon;
