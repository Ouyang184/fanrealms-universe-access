REVOKE SELECT (stripe_session_id) ON public.bundle_purchases FROM authenticated, anon;
REVOKE SELECT (stripe_subscription_id, stripe_customer_id) ON public.user_subscriptions FROM authenticated, anon;
REVOKE SELECT (stripe_transfer_id) ON public.creator_earnings FROM authenticated, anon;
REVOKE SELECT (stripe_account_id) ON public.creator_stripe_accounts FROM authenticated, anon;
REVOKE SELECT (is_flagged, flagged_reason, is_moderated) ON public.tags FROM authenticated, anon;