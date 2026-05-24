# Creator Payouts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pay creators their cut of marketplace asset sales via Stripe Connect, with a "sell first connect later" fallback that holds earnings until they onboard.

**Architecture:** When a creator has Stripe Connect, checkout sessions use destination charges (Stripe splits automatically). When they don't, the purchase webhook records earnings as `pending` in `creator_earnings`. A new `transfer_pending_earnings` edge function action bulk-transfers held earnings after onboarding. Frontend shows earnings balance and connect prompt in the dashboard.

**Tech Stack:** Stripe Connect Express, Supabase Edge Functions, React 18, TanStack Query.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260524000002_creator_payouts.sql` | Create | Add `platform_fee_rate` to creators, `purchase_id`+`status` to creator_earnings |
| `supabase/functions/create-checkout-session/index.ts` | Modify | Fetch fee rate + Connect status, add destination charge when creator has Connect |
| `supabase/functions/stripe-webhook/handlers/checkout-webhook.ts` | Modify | Record creator earnings after purchase, use creator's fee rate |
| `supabase/functions/stripe-connect/index.ts` | Modify | Add `transfer_pending_earnings` action |
| `src/hooks/useCreatorEarnings.ts` | Create | Fetch earnings summary + transfer mutation |
| `src/components/dashboard/EarningsCard.tsx` | Create | Balance display, connect banner, recent sales list |
| `src/pages/Dashboard.tsx` | Modify | Add EarningsCard below stats |
| `src/pages/AccountSettings.tsx` | Modify | Add platform fee rate picker in a new Payouts tab |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260524000002_creator_payouts.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260524000002_creator_payouts.sql

-- 1. Add platform_fee_rate to creators (1-5%, default 5)
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS platform_fee_rate integer NOT NULL DEFAULT 5
  CHECK (platform_fee_rate BETWEEN 1 AND 5);

-- 2. Add purchase_id and status to creator_earnings
ALTER TABLE public.creator_earnings
  ADD COLUMN IF NOT EXISTS purchase_id uuid REFERENCES public.purchases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'transferred', 'failed'));

-- 3. Index for efficient pending earnings lookups
CREATE INDEX IF NOT EXISTS creator_earnings_creator_status_idx
  ON public.creator_earnings(creator_id, status);

-- 4. Creators can read their own earnings (already exists but may need status filter)
-- Ensure existing RLS covers the new columns — no new policies needed since
-- the existing "Creators can view their own earnings" policy selects all columns.
```

- [ ] **Step 2: Apply migration**

Use `mcp__plugin_supabase_supabase__apply_migration` with:
- project_id: `eaeqyctjljbtcatlohky`
- name: `creator_payouts`
- query: full SQL above

- [ ] **Step 3: Verify**

Run via `mcp__plugin_supabase_supabase__execute_sql`:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('creators', 'creator_earnings')
  AND column_name IN ('platform_fee_rate', 'purchase_id', 'status')
ORDER BY table_name, column_name;
```
Expected: 3 rows — `creators.platform_fee_rate` (integer, default 5), `creator_earnings.purchase_id` (uuid), `creator_earnings.status` (text, default 'pending').

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\jakey\Claude Code\fanrealms-universe-access"
git add supabase/migrations/20260524000002_creator_payouts.sql
git commit -m "feat: add platform_fee_rate to creators and status/purchase_id to creator_earnings"
```

---

## Task 2: Update checkout-webhook to record marketplace earnings

**Files:**
- Modify: `supabase/functions/stripe-webhook/handlers/checkout-webhook.ts`

**Context:** The file currently handles `checkout.session.completed`. For marketplace (non-subscription) purchases it fetches the product price, inserts into `purchases`, and returns. It does NOT yet record creator earnings. We need to:
1. Fetch the creator's `platform_fee_rate` from the `creators` table
2. Use it instead of the hardcoded 1% calculation (fix the existing `platformFee` calc)
3. Capture the inserted `purchase_id` from the `purchases` insert
4. Insert into `creator_earnings` with correct `status` based on whether creator has Connect

The current relevant code block in `checkout-webhook.ts` is the `if (!session.subscription)` branch (lines ~16–60). Read the file at `C:\Users\jakey\Claude Code\fanrealms-universe-access\supabase\functions\stripe-webhook\handlers\checkout-webhook.ts` before editing.

- [ ] **Step 1: Read the current file**

Read `supabase/functions/stripe-webhook/handlers/checkout-webhook.ts` in full.

- [ ] **Step 2: Replace the marketplace purchase block**

Find the `if (!session.subscription)` branch. Replace the entire block (from `if (!session.subscription) {` through its closing `return createJsonResponse({ success: true });`) with:

```typescript
  if (!session.subscription) {
    // One-time marketplace purchase
    const { product_id, buyer_id, creator_id } = session.metadata ?? {};

    if (!product_id || !buyer_id || !creator_id) {
      console.log('[CheckoutHandler] Missing metadata for one-time purchase, skipping');
      return createJsonResponse({ success: true });
    }

    // Fetch product price AND creator fee rate together
    const { data: product, error: productFetchError } = await supabaseService
      .from('digital_products')
      .select('price, creator_id')
      .eq('id', product_id)
      .maybeSingle();

    if (productFetchError) {
      console.error('[CheckoutHandler] Error fetching product:', productFetchError);
      throw productFetchError;
    }

    const { data: creatorRow } = await supabaseService
      .from('creators')
      .select('platform_fee_rate')
      .eq('id', creator_id)
      .maybeSingle();

    const feeRate = creatorRow?.platform_fee_rate ?? 5;
    const amount = Number(product?.price ?? 0);
    const platformFee = parseFloat((amount * feeRate / 100).toFixed(2));
    const netAmount = parseFloat((amount - platformFee).toFixed(2));

    // Insert purchase and capture its id
    const { data: insertedPurchase, error: insertError } = await supabaseService
      .from('purchases')
      .insert({
        buyer_id,
        product_id,
        creator_id,
        amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent ?? null,
        status: 'completed',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[CheckoutHandler] Error inserting purchase:', insertError);
      throw insertError;
    }

    console.log('[CheckoutHandler] Purchase recorded:', insertedPurchase.id);

    // Check if creator has Stripe Connect with charges enabled
    const { data: stripeAcct } = await supabaseService
      .from('creator_stripe_accounts')
      .select('stripe_charges_enabled')
      .eq('creator_id', creator_id)
      .maybeSingle();

    const hasConnect = !!stripeAcct?.stripe_charges_enabled;

    // Record creator earnings
    const { error: earningsError } = await supabaseService
      .from('creator_earnings')
      .insert({
        creator_id,
        purchase_id: insertedPurchase.id,
        amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        earning_type: 'marketplace',
        status: hasConnect ? 'transferred' : 'pending',
      });

    if (earningsError) {
      // Non-fatal: purchase is recorded, log and continue
      console.error('[CheckoutHandler] Error recording creator earnings:', earningsError);
    }

    console.log('[CheckoutHandler] One-time purchase and earnings recorded. Connect status:', hasConnect);
    return createJsonResponse({ success: true });
  }
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/stripe-webhook/handlers/checkout-webhook.ts
git commit -m "feat: record creator earnings on marketplace purchase with dynamic fee rate"
```

---

## Task 3: Update create-checkout-session for destination charges

**Files:**
- Modify: `supabase/functions/create-checkout-session/index.ts`

**Context:** The file creates a Stripe Checkout session. Currently it fetches product data and creates the session without any Connect destination. We need to:
1. Fetch the creator's `platform_fee_rate` and Stripe account ID (from `creator_stripe_accounts`)
2. When creator has Stripe Connect (`stripe_charges_enabled = true`), add `payment_intent_data` with `application_fee_amount` and `transfer_data.destination`
3. When creator does not have Connect, create session as-is (no change)

Read the full file at `C:\Users\jakey\Claude Code\fanrealms-universe-access\supabase\functions\create-checkout-session\index.ts` before editing.

- [ ] **Step 1: Read the current file**

Read `supabase/functions/create-checkout-session/index.ts` in full.

- [ ] **Step 2: Add Connect lookup after product fetch**

After the product fetch block (after `if (!product) throw new Error("Product not found or not published")`), insert:

```typescript
    // Fetch creator's fee rate and Stripe Connect status
    const { data: creatorData } = await supabaseServiceClient
      .from('creators')
      .select('platform_fee_rate')
      .eq('id', product.creator_id)
      .maybeSingle();

    const { data: stripeAccount } = await supabaseServiceClient
      .from('creator_stripe_accounts')
      .select('stripe_account_id, stripe_charges_enabled')
      .eq('creator_id', product.creator_id)
      .maybeSingle();

    const platformFeeRate = creatorData?.platform_fee_rate ?? 5;
    const hasConnect =
      !!stripeAccount?.stripe_charges_enabled &&
      !!stripeAccount?.stripe_account_id;
    const applicationFeeAmount = hasConnect
      ? Math.round(amountCents * platformFeeRate / 100)
      : 0;
```

- [ ] **Step 3: Update the session creation call**

Find the `const session = await stripe.checkout.sessions.create({` call. Replace it with:

```typescript
    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: product.title,
              description: (product as any).short_description || undefined,
              images: (product as any).cover_image_url
                ? [(product as any).cover_image_url]
                : undefined,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        product_id: product.id,
        buyer_id: user.id,
        creator_id: product.creator_id,
      },
      success_url: `${origin}/purchase-success?product_id=${productId}`,
      cancel_url: `${origin}/marketplace/${productId}`,
    };

    if (hasConnect && stripeAccount?.stripe_account_id) {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: stripeAccount.stripe_account_id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
```

Remove the old `const session = await stripe.checkout.sessions.create({ ... })` block that this replaces.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/create-checkout-session/index.ts
git commit -m "feat: use Stripe destination charges when creator has Connect"
```

---

## Task 4: Add `transfer_pending_earnings` to stripe-connect edge function

**Files:**
- Modify: `supabase/functions/stripe-connect/index.ts`

**Context:** The file has a `switch (action)` block with cases `create_account`, `create_login_link`, `get_balance`. We add a new `transfer_pending_earnings` case. Read the full file at `C:\Users\jakey\Claude Code\fanrealms-universe-access\supabase\functions\stripe-connect\index.ts` before editing.

The file uses `logSecurityEvent` and `verifyCreatorAccess` helpers already defined at the top. Add the new case before the final `return new Response(JSON.stringify({ error: 'Invalid action' })` line.

- [ ] **Step 1: Read the current file**

Read `supabase/functions/stripe-connect/index.ts` in full.

- [ ] **Step 2: Add helper function for JSON responses**

At the top of the `serve` callback (just before the `switch (action)` statement), add this helper if it doesn't already exist:

```typescript
    const jsonOk = (body: unknown) =>
      new Response(JSON.stringify(body), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    const jsonErr = (msg: string, status = 400) =>
      new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
```

- [ ] **Step 3: Add the new case to the switch block**

Insert before `return new Response(JSON.stringify({ error: 'Invalid action' })`:

```typescript
      case 'transfer_pending_earnings': {
        // Resolve the caller's creator id from their user session
        const transferCreatorId = await verifyCreatorAccess(supabaseService, user.id);

        // Get their Stripe account id from the database
        const { data: transferCreator } = await supabaseService
          .from('creators')
          .select('stripe_account_id')
          .eq('id', transferCreatorId)
          .single();

        if (!transferCreator?.stripe_account_id) {
          return jsonErr('No Stripe account connected', 400);
        }

        // Fetch all pending marketplace earnings for this creator
        const { data: pendingEarnings, error: pendingErr } = await supabaseService
          .from('creator_earnings')
          .select('id, net_amount')
          .eq('creator_id', transferCreatorId)
          .eq('status', 'pending');

        if (pendingErr) throw pendingErr;

        if (!pendingEarnings || pendingEarnings.length === 0) {
          return jsonOk({ transferred: 0, amount: 0 });
        }

        const totalCents = Math.round(
          pendingEarnings.reduce((sum, e) => sum + Number(e.net_amount), 0) * 100
        );

        // Stripe minimum transfer is $1.00 (100 cents)
        if (totalCents < 100) {
          return jsonOk({ transferred: 0, amount: 0, reason: 'Below $1.00 minimum' });
        }

        // Create the Stripe transfer from platform account to creator's account
        const transfer = await stripe.transfers.create({
          amount: totalCents,
          currency: 'usd',
          destination: transferCreator.stripe_account_id,
          description: `FanRealms pending earnings — ${pendingEarnings.length} sale(s)`,
        });

        // Mark all pending earnings as transferred
        const earningIds = pendingEarnings.map((e) => e.id);
        const { error: updateErr } = await supabaseService
          .from('creator_earnings')
          .update({ status: 'transferred', stripe_transfer_id: transfer.id })
          .in('id', earningIds);

        if (updateErr) {
          console.error('[stripe-connect] Failed to update earnings status:', updateErr);
          // Transfer succeeded — log error but don't fail the response
        }

        logSecurityEvent('PENDING_EARNINGS_TRANSFERRED', {
          creatorId: transferCreatorId,
          count: pendingEarnings.length,
          totalCents,
        }, user.id);

        return jsonOk({
          transferred: pendingEarnings.length,
          amount: totalCents / 100,
          transferId: transfer.id,
        });
      }
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/stripe-connect/index.ts
git commit -m "feat: add transfer_pending_earnings action to stripe-connect function"
```

---

## Task 5: `useCreatorEarnings` hook

**Files:**
- Create: `src/hooks/useCreatorEarnings.ts`

**Context:**
- Supabase client from `@/lib/supabase`
- `useAuth` from `@/contexts/AuthContext`
- TanStack Query: `useQuery`, `useMutation`, `useQueryClient`
- The `creator_earnings` table columns: `id`, `creator_id`, `amount`, `platform_fee`, `net_amount`, `earning_type`, `status`, `purchase_id`, `created_at`
- The `creator_stripe_status` view: `{ is_connected, stripe_charges_enabled, stripe_onboarding_complete, stripe_payouts_enabled }` — join on `user_id`

- [ ] **Step 1: Create the file**

```typescript
// src/hooks/useCreatorEarnings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface EarningRow {
  id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  earning_type: string;
  status: 'pending' | 'transferred' | 'failed';
  created_at: string;
}

export interface EarningsSummary {
  pendingBalance: number;      // sum of net_amount where status = 'pending'
  totalEarned: number;         // sum of net_amount across all statuses
  recentEarnings: EarningRow[];// last 5 earnings, newest first
}

export function useCreatorEarnings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['creator-earnings', user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60,
    queryFn: async (): Promise<EarningsSummary> => {
      // Get creator id for this user
      const { data: creator, error: creatorErr } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (creatorErr) throw creatorErr;
      if (!creator) return { pendingBalance: 0, totalEarned: 0, recentEarnings: [] };

      const { data: earnings, error } = await supabase
        .from('creator_earnings')
        .select('id, amount, platform_fee, net_amount, earning_type, status, created_at')
        .eq('creator_id', creator.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (earnings ?? []) as EarningRow[];
      const pendingBalance = rows
        .filter((e) => e.status === 'pending')
        .reduce((sum, e) => sum + Number(e.net_amount), 0);
      const totalEarned = rows
        .filter((e) => e.status === 'transferred')
        .reduce((sum, e) => sum + Number(e.net_amount), 0);

      return {
        pendingBalance,
        totalEarned,
        recentEarnings: rows.slice(0, 5),
      };
    },
  });
}

export function useTransferPendingEarnings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { action: 'transfer_pending_earnings' },
      });
      if (error) throw error;
      return data as { transferred: number; amount: number; transferId?: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-earnings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['stripeConnectStatus', user?.id] });
    },
  });
}

export function useCreatorFeeRate() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['creator-fee-rate', user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('creators')
        .select('platform_fee_rate')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.platform_fee_rate ?? 5;
    },
  });
}

export function useUpdateCreatorFeeRate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rate: number) => {
      if (rate < 1 || rate > 5) throw new Error('Fee rate must be between 1 and 5');
      const { error } = await supabase
        .from('creators')
        .update({ platform_fee_rate: rate })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-fee-rate', user?.id] });
    },
  });
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd "C:\Users\jakey\Claude Code\fanrealms-universe-access"
npx tsc --noEmit 2>&1 | findstr /i "useCreatorEarnings"
```
Expected: no output (no errors in the new file).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCreatorEarnings.ts
git commit -m "feat: add useCreatorEarnings hook with earnings summary and transfer mutation"
```

---

## Task 6: `EarningsCard` component

**Files:**
- Create: `src/components/dashboard/EarningsCard.tsx`

**Context:**
- Uses `useCreatorEarnings`, `useTransferPendingEarnings` from `@/hooks/useCreatorEarnings`
- Uses `useStripeConnect` from `@/hooks/useStripeConnect` — specifically `connectStatus` (has `stripe_charges_enabled`) and `createConnectAccount`
- Uses `useCreatorProfile` or the creator's id — get creator id by querying creators table for `user_id = user.id`. Actually since `createConnectAccount` in `useStripeConnect` requires a `creatorId`, we need it.
- `toast` from `sonner`
- Look at `Dashboard.tsx` for the `StatCard` style: `bg-white border border-[#eee] rounded-xl p-5`
- Icons from `lucide-react`: `DollarSign`, `AlertCircle`, `ExternalLink`, `ArrowRight`
- `formatDistanceToNow` from `date-fns`

- [ ] **Step 1: Create the component**

```typescript
// src/components/dashboard/EarningsCard.tsx
import { formatDistanceToNow } from 'date-fns';
import { DollarSign, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreatorEarnings, useTransferPendingEarnings } from '@/hooks/useCreatorEarnings';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

function useCreatorId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-creator-id', user?.id],
    enabled: !!user?.id,
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data?.id ?? null;
    },
  });
}

const fmt = (n: number) => `$${n.toFixed(2)}`;

export function EarningsCard() {
  const { data: summary, isLoading } = useCreatorEarnings();
  const { connectStatus, createConnectAccount, createLoginLink, isLoading: connectLoading } = useStripeConnect();
  const { data: creatorId } = useCreatorId();
  const transferMutation = useTransferPendingEarnings();

  const isConnected = !!connectStatus?.stripe_charges_enabled;
  const hasPending = (summary?.pendingBalance ?? 0) > 0;

  const handleConnect = () => {
    if (!creatorId) return;
    createConnectAccount(creatorId);
  };

  const handleTransfer = async () => {
    try {
      const result = await transferMutation.mutateAsync();
      if (result.transferred > 0) {
        toast.success(`$${result.amount.toFixed(2)} transferred to your Stripe account!`);
      } else {
        toast.info('No pending earnings to transfer.');
      }
    } catch {
      toast.error('Transfer failed. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-[#eee] rounded-xl p-5 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#eee] rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">
          Earnings
        </div>
        {isConnected && (
          <button
            onClick={createLoginLink}
            disabled={connectLoading}
            className="flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            Stripe Dashboard
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Balance row */}
      <div className="flex gap-6">
        <div>
          <div className="text-[11px] text-[#aaa] mb-0.5">Pending</div>
          <div className="text-[22px] font-bold tracking-[-0.5px] text-[#111]">
            {fmt(summary?.pendingBalance ?? 0)}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-[#aaa] mb-0.5">Paid out</div>
          <div className="text-[22px] font-bold tracking-[-0.5px] text-[#111]">
            {fmt(summary?.totalEarned ?? 0)}
          </div>
        </div>
      </div>

      {/* Connect banner or transfer button */}
      {!isConnected ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-amber-800">
              {hasPending
                ? `Connect Stripe to receive ${fmt(summary?.pendingBalance ?? 0)}`
                : 'Connect Stripe to receive future payouts'}
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Takes ~2 minutes. Stripe Express account.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={connectLoading || !creatorId}
            className="flex-shrink-0 text-[11px]"
          >
            Connect
          </Button>
        </div>
      ) : hasPending ? (
        <Button
          size="sm"
          onClick={handleTransfer}
          disabled={transferMutation.isPending}
          className="w-full"
        >
          <DollarSign className="w-3.5 h-3.5 mr-1.5" />
          {transferMutation.isPending
            ? 'Transferring…'
            : `Transfer ${fmt(summary?.pendingBalance ?? 0)} to Stripe`}
        </Button>
      ) : null}

      {/* Recent earnings */}
      {(summary?.recentEarnings ?? []).length > 0 && (
        <div className="border-t border-[#f5f5f5] pt-3 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">
            Recent
          </div>
          {summary!.recentEarnings.map((e) => (
            <div key={e.id} className="flex items-center justify-between">
              <span className="text-[12px] text-[#555]">
                {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  e.status === 'transferred'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {e.status === 'transferred' ? 'paid' : 'pending'}
                </span>
                <span className="text-[13px] font-semibold text-[#111]">
                  {fmt(Number(e.net_amount))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd "C:\Users\jakey\Claude Code\fanrealms-universe-access"
npx tsc --noEmit 2>&1 | findstr /i "EarningsCard"
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/EarningsCard.tsx
git commit -m "feat: add EarningsCard component for dashboard earnings display"
```

---

## Task 7: Add EarningsCard to Dashboard and handle Stripe redirect

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Context:** The Dashboard has a `<DashboardLayout>` wrapper, a header row, a stats grid (3 StatCards), and a "Your assets" section. We add `EarningsCard` below the stats grid. We also handle the `?stripe_success=true` redirect by calling `transfer_pending_earnings` automatically.

Read `src/pages/Dashboard.tsx` in full before editing.

- [ ] **Step 1: Read the current file**

Read `C:\Users\jakey\Claude Code\fanrealms-universe-access\src\pages\Dashboard.tsx` in full.

- [ ] **Step 2: Add imports**

Add to the existing imports:
```typescript
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { EarningsCard } from '@/components/dashboard/EarningsCard';
import { useTransferPendingEarnings } from '@/hooks/useCreatorEarnings';
import { toast } from 'sonner';
```

Note: `useEffect` may already be imported — only add if missing.

- [ ] **Step 3: Add stripe redirect handler inside `DashboardPage`**

Inside the `DashboardPage` function, after the existing hooks, add:

```typescript
  const [searchParams, setSearchParams] = useSearchParams();
  const transferMutation = useTransferPendingEarnings();

  // Handle redirect back from Stripe Connect onboarding
  useEffect(() => {
    if (searchParams.get('stripe_success') !== 'true') return;

    // Clear the param immediately so refresh doesn't re-trigger
    setSearchParams({}, { replace: true });

    // Transfer any pending earnings now that Connect is active
    transferMutation.mutateAsync()
      .then((result) => {
        if (result.transferred > 0) {
          toast.success(`Stripe connected! $${result.amount.toFixed(2)} transferred to your account.`);
        } else {
          toast.success('Stripe connected! Future earnings will be paid automatically.');
        }
      })
      .catch(() => {
        toast.info('Stripe connected! Your pending earnings will be transferred shortly.');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only
```

- [ ] **Step 4: Add `EarningsCard` below the stats grid**

Find the closing `</div>` of the stats grid section (the one that wraps the 3 `StatCard` components). After it, insert:

```tsx
        {/* Earnings */}
        <EarningsCard />
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | findstr /i "Dashboard"
```
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: add EarningsCard to dashboard and handle Stripe Connect redirect"
```

---

## Task 8: Fee rate picker in Account Settings

**Files:**
- Modify: `src/pages/AccountSettings.tsx`

**Context:** AccountSettings has `<Tabs>` with existing tabs. We add a "Payouts" tab. Read the file to see the existing tab structure — look for `<TabsList>` and `<TabsContent>` blocks.

- [ ] **Step 1: Read current AccountSettings.tsx**

Read `C:\Users\jakey\Claude Code\fanrealms-universe-access\src\pages\AccountSettings.tsx` in full.

- [ ] **Step 2: Add imports**

Add to the existing imports:
```typescript
import { useCreatorFeeRate, useUpdateCreatorFeeRate } from '@/hooks/useCreatorEarnings';
import { useStripeConnect } from '@/hooks/useStripeConnect';
```

- [ ] **Step 3: Add Payouts tab to the TabsList**

Find the `<TabsList>` element. Add a new trigger:
```tsx
<TabsTrigger value="payouts">Payouts</TabsTrigger>
```

- [ ] **Step 4: Add Payouts tab content**

After the last `</TabsContent>` closing tag, add:

```tsx
<TabsContent value="payouts" className="space-y-6 mt-6">
  <PayoutsTab />
</TabsContent>
```

- [ ] **Step 5: Add the `PayoutsTab` component inside AccountSettings.tsx**

Add this function before the `export default function AccountSettings()` line:

```tsx
function PayoutsTab() {
  const { data: feeRate, isLoading: feeLoading } = useCreatorFeeRate();
  const updateFeeRate = useUpdateCreatorFeeRate();
  const { connectStatus, createConnectAccount, createLoginLink, isLoading: connectLoading } = useStripeConnect();
  const { user } = useAuth();
  const { toast } = useToast();
  const [creatorId, setCreatorId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('creators').select('id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setCreatorId(data?.id ?? null));
  }, [user?.id]);

  const handleFeeChange = async (rate: number) => {
    try {
      await updateFeeRate.mutateAsync(rate);
      toast({ title: 'Fee rate updated', description: `You now keep ${100 - rate}% of each sale.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update fee rate.', variant: 'destructive' });
    }
  };

  const isConnected = !!connectStatus?.stripe_charges_enabled;
  const currentRate = feeRate ?? 5;

  return (
    <div className="space-y-6">
      {/* Stripe Connect */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[15px]">Stripe Payouts</CardTitle>
          <CardDescription className="text-[13px]">
            Connect your Stripe account to receive earnings from asset sales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[13px] font-medium">Stripe connected</span>
              </div>
              <Button variant="outline" size="sm" onClick={createLoginLink} disabled={connectLoading}>
                Open Stripe Dashboard
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[13px] text-muted-foreground">Not connected</span>
              </div>
              <Button size="sm" onClick={() => creatorId && createConnectAccount(creatorId)} disabled={connectLoading || !creatorId}>
                Connect Stripe
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform fee rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[15px]">Platform Fee</CardTitle>
          <CardDescription className="text-[13px]">
            The percentage FanRealms keeps from each sale. You keep the rest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feeLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleFeeChange(rate)}
                    disabled={updateFeeRate.isPending}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-semibold border transition-colors ${
                      currentRate === rate
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-[#555] border-[#eee] hover:border-primary hover:text-primary'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-muted-foreground">
                At {currentRate}% — you keep <strong>{100 - currentRate}%</strong> of each sale (before Stripe's ~2.9% + 30¢ processing fee).
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

Note: `PayoutsTab` uses `useState`, `useEffect`, `supabase`, `useAuth`, `useToast`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Button`, `Skeleton` — all already imported in AccountSettings.tsx. Verify and add any missing imports.

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | findstr /i "AccountSettings"
```
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/AccountSettings.tsx
git commit -m "feat: add Payouts tab with Stripe Connect status and fee rate picker"
```

---

## Task 9: Update Payments.tsx to reflect accurate fee info

**Files:**
- Modify: `src/pages/Payments.tsx`

**Context:** The Payments page currently states "FanRealms takes a 10% platform fee" and "Payouts go through Stripe Connect directly to your bank account". The first is wrong (it's 1–5%, creator-chosen). The second is now accurate. Fix both.

- [ ] **Step 1: Update the selling & payouts bullet list**

In `src/pages/Payments.tsx`, find the array of selling/payouts bullet strings and replace it with:

```typescript
              'Creators choose their own platform fee: 1% to 5% (default 5%)',
              "Stripe's processing fee (~2.9% + 30¢) is separate and deducted automatically",
              'Payouts go through Stripe Connect directly to your bank account',
              'Connect Stripe in your dashboard settings to receive earnings',
              'You are responsible for your own taxes and VAT',
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Payments.tsx
git commit -m "fix: update Payments page to reflect creator-chosen 1-5% fee and Stripe Connect"
```

---

## Task 10: Push to GitHub

- [ ] **Step 1: Pull and push**

```bash
cd "C:\Users\jakey\Claude Code\fanrealms-universe-access"
git pull --rebase origin main
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ `platform_fee_rate` column (1–5%) added to `creators` — Task 1
- ✅ `purchase_id` and `status` added to `creator_earnings` — Task 1
- ✅ Checkout records earnings with dynamic fee rate — Task 2
- ✅ Destination charges when creator has Connect — Task 3
- ✅ `transfer_pending_earnings` edge function action — Task 4
- ✅ `useCreatorEarnings`, `useTransferPendingEarnings`, `useCreatorFeeRate`, `useUpdateCreatorFeeRate` hooks — Task 5
- ✅ `EarningsCard` with pending balance, paid out, connect banner, recent earnings — Task 6
- ✅ `EarningsCard` added to Dashboard — Task 7
- ✅ `?stripe_success=true` redirect triggers transfer — Task 7
- ✅ Fee rate picker in AccountSettings Payouts tab — Task 8
- ✅ Payments.tsx updated with correct fee info — Task 9

**Type consistency:**
- `EarningRow.status` is `'pending' | 'transferred' | 'failed'` — matches DB CHECK constraint and is used consistently in `useCreatorEarnings` and `EarningsCard`
- `useTransferPendingEarnings` returns `{ transferred: number; amount: number; transferId?: string }` — matches the edge function response
- `createConnectAccount(creatorId)` takes a `string` — `useCreatorId()` returns `string | null`, guarded with `if (!creatorId)` before calling

**No placeholders found.**
