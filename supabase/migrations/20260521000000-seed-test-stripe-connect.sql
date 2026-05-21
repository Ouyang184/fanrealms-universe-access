-- Seed a test Stripe Connect account for the unfan creator so the
-- subscription subscribe button is active in test mode.
-- The stripe_account_id acct_1TZL4h4gn0xrz8Vn is a test-mode Express
-- account created via the Stripe API. Remove/replace this when the
-- creator completes real Stripe Connect onboarding.

INSERT INTO public.creator_stripe_accounts (
  creator_id,
  stripe_account_id,
  stripe_onboarding_complete,
  stripe_charges_enabled,
  stripe_payouts_enabled
)
VALUES (
  'b00d2fb9-41c6-40c3-a06b-6aff5bbcf975', -- unfan / FanRealmsWeb
  'acct_1TZL4h4gn0xrz8Vn',                -- test-mode Express account
  true,
  true,
  true
)
ON CONFLICT (creator_id) DO UPDATE SET
  stripe_account_id       = EXCLUDED.stripe_account_id,
  stripe_onboarding_complete = true,
  stripe_charges_enabled  = true,
  stripe_payouts_enabled  = true;
