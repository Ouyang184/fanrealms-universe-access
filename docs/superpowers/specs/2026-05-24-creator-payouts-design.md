# Creator Payouts Design

## Goal
Pay creators their cut of marketplace asset sales automatically via Stripe Connect, with a "sell first, connect later" fallback that holds earnings until the creator completes onboarding.

## Architecture
Three-layer system: (1) creator sets their platform fee rate once in settings, (2) checkout uses Stripe destination charges to split money at payment time when the creator has Connect, (3) when they don't, earnings are held as `pending` in `creator_earnings` and transferred in bulk when they connect. Frontend surfaces the balance and connect prompt in the creator dashboard.

## Tech Stack
- Stripe Connect (Express accounts) — already partially wired via `stripe-connect` edge function
- Supabase PostgreSQL + Edge Functions
- React 18 + TanStack Query + existing dashboard components

---

## Existing Infrastructure (reuse as-is)

- `creator_stripe_accounts` table — tracks `stripe_account_id`, `stripe_charges_enabled`, `stripe_payouts_enabled`
- `creator_earnings` table — tracks `amount`, `platform_fee`, `net_amount`, `stripe_transfer_id`, `earning_type`
- `stripe-connect` edge function — handles `create_account`, `create_login_link`, `get_balance` actions
- `supabase/functions/create-checkout-session/index.ts` — the purchase entry point to modify
- `supabase/functions/stripe-webhook/handlers/checkout-webhook.ts` — records purchases, needs to also record earnings

---

## Data Layer Changes

### 1. Add `platform_fee_rate` to `creators`

```sql
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS platform_fee_rate integer NOT NULL DEFAULT 5
  CHECK (platform_fee_rate BETWEEN 1 AND 5);
```

This is the percentage FanRealms takes (1–5%). Creator keeps `(100 - platform_fee_rate)%`.

### 2. Add `purchase_id` and `status` to `creator_earnings`

```sql
ALTER TABLE public.creator_earnings
  ADD COLUMN IF NOT EXISTS purchase_id uuid REFERENCES public.purchases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'transferred', 'failed'));
```

- `pending` — creator hasn't connected Stripe yet; earnings held
- `transferred` — Stripe transfer completed; `stripe_transfer_id` populated
- `failed` — transfer attempted but failed

---

## Purchase Flow

### When creator HAS Stripe Connect (charges_enabled = true)

`create-checkout-session` adds to the Stripe session:

```typescript
payment_intent_data: {
  application_fee_amount: Math.round(amountCents * creator.platform_fee_rate / 100),
  transfer_data: {
    destination: creatorStripeAccountId,
  },
},
```

Stripe automatically splits at payment time — no manual transfer needed.

When `checkout.session.completed` fires, `checkout-webhook.ts` inserts into `creator_earnings`:
```typescript
{
  creator_id: creator.id,
  purchase_id: purchaseId,
  amount: product.price,
  platform_fee: product.price * (creator.platform_fee_rate / 100),
  net_amount: product.price * (1 - creator.platform_fee_rate / 100),
  earning_type: 'marketplace',
  status: 'transferred',
  stripe_transfer_id: paymentIntent.transfer_data?.destination ?? null,
}
```

### When creator does NOT have Stripe Connect

`create-checkout-session` runs as today (no destination charge). All money lands in the platform account.

`checkout-webhook.ts` inserts into `creator_earnings` with `status: 'pending'`.

### After creator completes Stripe Connect onboarding

A new `transfer_pending_earnings` action is added to `stripe-connect` edge function:

1. Fetch all `creator_earnings` where `creator_id = X` and `status = 'pending'`
2. Sum `net_amount` across all pending rows
3. If total > 0, create a Stripe transfer: `stripe.transfers.create({ amount: totalCents, currency: 'usd', destination: stripeAccountId })`
4. Update all pending rows: `status = 'transferred'`, `stripe_transfer_id = transfer.id`

This action is called from the frontend after the `stripe_success=true` redirect from Stripe onboarding.

---

## `create-checkout-session` Changes

Before creating the Stripe session, fetch the creator's Stripe status:

```typescript
// Fetch creator's fee rate and Stripe Connect status
const { data: creatorData } = await supabaseServiceClient
  .from('creators')
  .select('id, platform_fee_rate')
  .eq('id', product.creator_id)
  .single();

const { data: stripeAccount } = await supabaseServiceClient
  .from('creator_stripe_accounts')
  .select('stripe_account_id, stripe_charges_enabled')
  .eq('creator_id', product.creator_id)
  .maybeSingle();

const platformFeeRate = creatorData?.platform_fee_rate ?? 5;
const hasConnect = !!stripeAccount?.stripe_charges_enabled && !!stripeAccount?.stripe_account_id;
```

Then conditionally add `payment_intent_data` to the session:

```typescript
const sessionParams: Stripe.Checkout.SessionCreateParams = {
  mode: 'payment',
  // ... existing params ...
};

if (hasConnect) {
  sessionParams.payment_intent_data = {
    application_fee_amount: Math.round(amountCents * platformFeeRate / 100),
    transfer_data: { destination: stripeAccount.stripe_account_id },
  };
}

const session = await stripe.checkout.sessions.create(sessionParams);
```

---

## `checkout-webhook.ts` Changes

After recording the purchase, also insert into `creator_earnings`:

```typescript
// Determine Connect status for this creator
const { data: stripeAcct } = await supabaseService
  .from('creator_stripe_accounts')
  .select('stripe_charges_enabled')
  .eq('creator_id', creator_id)
  .maybeSingle();

const { data: creatorRow } = await supabaseService
  .from('creators')
  .select('platform_fee_rate')
  .eq('id', creator_id)
  .single();

const feeRate = creatorRow?.platform_fee_rate ?? 5;
const gross = amount;
const fee = parseFloat((gross * feeRate / 100).toFixed(2));
const net = parseFloat((gross - fee).toFixed(2));
const hasConnect = !!stripeAcct?.stripe_charges_enabled;

await supabaseService.from('creator_earnings').insert({
  creator_id,
  purchase_id: purchaseRecordId,
  amount: gross,
  platform_fee: fee,
  net_amount: net,
  earning_type: 'marketplace',
  status: hasConnect ? 'transferred' : 'pending',
});
```

---

## New `stripe-connect` action: `transfer_pending_earnings`

```typescript
case 'transfer_pending_earnings': {
  const creatorId = await verifyCreatorAccess(supabaseService, user.id);

  // Get creator's Stripe account
  const { data: creator } = await supabaseService
    .from('creators')
    .select('stripe_account_id')
    .eq('id', creatorId)
    .single();

  if (!creator?.stripe_account_id) {
    return errorResponse('No Stripe account connected', 400);
  }

  // Fetch all pending earnings
  const { data: pendingEarnings } = await supabaseService
    .from('creator_earnings')
    .select('id, net_amount')
    .eq('creator_id', creatorId)
    .eq('status', 'pending');

  if (!pendingEarnings || pendingEarnings.length === 0) {
    return jsonResponse({ transferred: 0, amount: 0 });
  }

  const totalCents = Math.round(
    pendingEarnings.reduce((sum, e) => sum + Number(e.net_amount), 0) * 100
  );

  if (totalCents < 100) {
    return jsonResponse({ transferred: 0, amount: 0, reason: 'Below minimum' });
  }

  // Create the Stripe transfer
  const transfer = await stripe.transfers.create({
    amount: totalCents,
    currency: 'usd',
    destination: creator.stripe_account_id,
    description: `FanRealms pending earnings — ${pendingEarnings.length} sales`,
  });

  // Mark all pending earnings as transferred
  const ids = pendingEarnings.map((e) => e.id);
  await supabaseService
    .from('creator_earnings')
    .update({ status: 'transferred', stripe_transfer_id: transfer.id })
    .in('id', ids);

  return jsonResponse({ transferred: pendingEarnings.length, amount: totalCents / 100 });
}
```

---

## Frontend

### New hook: `useCreatorEarnings`

```
src/hooks/useCreatorEarnings.ts
```

- `useEarningsSummary()` — returns `{ pendingBalance, totalEarned, recentEarnings[] }`
- `useTransferPendingEarnings()` — calls `stripe-connect` with `transfer_pending_earnings` action

### Dashboard: Earnings card

New card in `src/pages/Dashboard.tsx` (or new `src/components/dashboard/EarningsCard.tsx`):

```
┌─────────────────────────────────────────────┐
│  Your Earnings                               │
│  $47.50 pending   $120.00 paid out           │
│                                              │
│  ⚠ Connect Stripe to receive $47.50         │
│  [Connect Stripe →]                          │
│                                              │
│  Recent sales:                               │
│  • Pixel Pack v2    $9.70    May 24          │
│  • Forest Tiles     $18.90   May 22          │
└─────────────────────────────────────────────┘
```

If creator already has Connect: no banner, shows "Next payout: your Stripe balance" with link to Stripe dashboard.

### Settings: Fee rate

In creator settings (wherever `platform_fee_rate` should live — the existing settings page):

```
Platform fee
[1%] [2%] [3%] [4%] [5%]  ← button group or select
You keep 97% of each sale
```

### After Stripe onboarding redirect

When the page loads with `?stripe_success=true`, call `transfer_pending_earnings` automatically, show a toast: *"Stripe connected! $X.XX transferred to your account."*

---

## Out of scope

- Subscription earnings (already tracked separately via `earning_type = 'subscription'`)
- Commission earnings (already tracked via `commission_request_id`)
- Tax forms / 1099 generation
- Payout schedule configuration (Stripe Express handles this in the creator's Stripe dashboard)
- Refund clawbacks from creator earnings (handled case-by-case)
