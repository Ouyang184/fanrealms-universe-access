
-- Drop billing_email column from user_subscriptions to prevent any chance of leakage
ALTER TABLE public.user_subscriptions DROP COLUMN IF EXISTS billing_email;

-- Restrict file_path on product_versions to service_role only.
-- Public/authenticated may still read non-sensitive metadata (version_number, release_notes, etc.)
REVOKE SELECT (file_path) ON public.product_versions FROM anon, authenticated;
