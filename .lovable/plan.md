# Plan: Lock Down Stripe Identifiers (Full Refactor)

Goal: no Stripe identifier (`stripe_account_id`, `stripe_subscription_id`, `stripe_customer_id`, `stripe_price_id`, `stripe_product_id`, `stripe_session_id`, `stripe_transfer_id`) ever reaches the browser. All actions that need them resolve them server-side using the service role.

## 1. Replace client-side Stripe ID reads with server-side resolution

| Client file | Current direct read | New approach |
|---|---|---|
| `useStripeConnect.ts` | reads `stripe_account_id` from `creator_stripe_status`, passes it to `stripe-connect` edge fn for `get_balance` / `create_login_link` | Stop selecting `stripe_account_id`. Send only `{ action }` — edge function looks up the account from `user_id` via service role. Use a boolean `is_connected` flag client-side. |
| `useCreatorStripeStatus.ts` | reads `stripe_account_id` to derive `isCreatorStripeReady` | Replace with a new RPC `get_creator_stripe_ready(creator_id)` returning only booleans (`onboarding_complete`, `charges_enabled`, `is_ready`). |
| `StripeConnectSection.tsx` | uses `connectStatus.stripe_account_id` for `isConnected` check and as arg to `createLoginLink` | Use boolean `is_connected`; `createLoginLink` takes no arg. |
| `useUserSubscriptions.ts` | type includes `stripe_subscription_id` / `stripe_customer_id`; edge function `get_user_subscriptions` already strips them — remove from type | Drop Stripe fields from the returned shape. |
| `SubscribedButton.tsx` | reads `subscription.stripe_subscription_id` to call cancel | Call `stripe-subscriptions` with `{ action: 'cancel_subscription', subscriptionId: <local_uuid> }`; edge function resolves the Stripe ID server-side. |
| `DeleteTierDialog.tsx` | selects `stripe_product_id, stripe_price_id` and `stripe_subscription_id` | Move full delete flow into a new edge function `delete-membership-tier` that handles Stripe product archive + DB row removal under service role. Client only sends `tierId`. |
| `useTierForm.ts` | selects `stripe_product_id, stripe_price_id` before update; writes them back after `create-stripe-product` | Move tier create/update Stripe sync into a new edge function `upsert-membership-tier` that returns the safe tier row (no Stripe IDs). |

## 2. Edge function changes

- `stripe-connect`: add lookup-by-user for `get_balance` and `create_login_link` so client no longer passes `accountId`. Keep existing param accepted for back-compat but ignore it.
- `stripe-subscriptions/handlers/cancel-subscription.ts`: accept the local `user_subscriptions.id` (UUID), look up `stripe_subscription_id` via service role, verify ownership, then cancel.
- `stripe-subscriptions/handlers/get-user-subscriptions.ts`: already returns safe fields — confirm and remove Stripe IDs from any remaining selects.
- New `delete-membership-tier`: verifies caller owns tier's creator, archives Stripe product if present, deletes/marks tier.
- New `upsert-membership-tier`: verifies ownership, calls existing `create-stripe-product`/`archive-stripe-product` logic internally, writes Stripe IDs server-side, returns safe row.
- New RPC `public.get_creator_stripe_ready(creator_id uuid)` (SECURITY DEFINER) returning `{ onboarding_complete, charges_enabled, payouts_enabled, is_connected }` — no `stripe_account_id`.

## 3. Database migration

```sql
-- creators table: drop the public Stripe column exposure
REVOKE SELECT (stripe_account_id) ON public.creators FROM anon, authenticated;

-- creator_stripe_accounts
REVOKE SELECT (stripe_account_id) ON public.creator_stripe_accounts FROM anon, authenticated;

-- user_subscriptions
REVOKE SELECT (stripe_subscription_id, stripe_customer_id) ON public.user_subscriptions FROM anon, authenticated;

-- membership_tiers
REVOKE SELECT (stripe_price_id, stripe_product_id) ON public.membership_tiers FROM anon, authenticated;

-- Re-assert previous fixes in case scanner saw stale state
REVOKE SELECT (stripe_session_id) ON public.bundle_purchases FROM anon, authenticated;
REVOKE SELECT (stripe_transfer_id) ON public.creator_earnings FROM anon, authenticated;

-- Recreate creator_stripe_status view as SECURITY INVOKER without stripe_account_id
DROP VIEW IF EXISTS public.creator_stripe_status;
CREATE VIEW public.creator_stripe_status
  WITH (security_invoker = true) AS
SELECT csa.creator_id,
       c.user_id,
       csa.stripe_onboarding_complete,
       csa.stripe_charges_enabled,
       csa.stripe_payouts_enabled
  FROM creator_stripe_accounts csa
  JOIN creators c ON c.id = csa.creator_id;

-- SECURITY DEFINER helper RPC
CREATE OR REPLACE FUNCTION public.get_creator_stripe_ready(_creator_id uuid)
RETURNS TABLE (
  onboarding_complete boolean,
  charges_enabled boolean,
  payouts_enabled boolean,
  is_connected boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    coalesce(stripe_onboarding_complete, false),
    coalesce(stripe_charges_enabled, false),
    coalesce(stripe_payouts_enabled, false),
    stripe_account_id IS NOT NULL
  FROM creator_stripe_accounts WHERE creator_id = _creator_id;
$$;
```

## 4. Other findings

- **`send-new-post-notification`**: already switched to `getUser()` — mark fixed in the scanner.
- **`avatars`/`banners` public buckets** (warn): intentional — profile/banner images need public URLs. Ignore with reason.
- **`feeds` Realtime** (warn): scope to user-specific channels in client code (`channel('feed:' + userId)`) and add a `realtime.messages` policy restricting topic subscription to the matching `auth.uid()`. Included in the migration.

## Order of operations

1. Apply migration (recreates view, adds RPC, revokes column grants).
2. Update/create edge functions (`stripe-connect`, `stripe-subscriptions/cancel`, new `delete-membership-tier`, new `upsert-membership-tier`).
3. Update client hooks/components to stop reading Stripe IDs and use new endpoints.
4. Mark scanner findings fixed; ignore the two intentional warns with notes.
5. Update `mem://security/payment-architecture` to record the new contract.

## Risk

- Breaks any in-flight subscription/tier flow until step 3 is deployed. Migration + edge fns must land together with client changes.
- `creator_stripe_status` view rename of columns will break any consumer still selecting `stripe_account_id` — only the two files above touch it; both are updated.
