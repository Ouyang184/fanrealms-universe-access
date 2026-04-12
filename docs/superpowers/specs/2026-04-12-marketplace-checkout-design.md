# Marketplace One-Time Purchase — Design Spec

**Date:** 2026-04-12  
**Status:** Approved  
**Scope:** Wire up the Stripe Checkout (hosted redirect) flow for one-time digital product purchases in the FanRealms marketplace.

---

## Context

Subscriptions and commissions are already fully working. The marketplace "Buy Now" button in `ProductDetail.tsx` is a placeholder. The `purchases` table and `checkout.session.completed` webhook listener already exist — they just need to be wired together via a new edge function and a small hook.

---

## Flow

1. Authenticated user visits `/marketplace/:id` and clicks **Buy Now**
2. `useMarketplaceCheckout` hook calls the `create-checkout-session` edge function
3. Edge function creates a Stripe `CheckoutSession` (mode: `payment`) and returns `{ url }`
4. Frontend redirects to `session.url` (Stripe-hosted checkout page)
5. User completes payment on Stripe
6. Stripe fires `checkout.session.completed` to the registered webhook endpoint
7. `stripe-webhook` → `checkout-webhook.ts` detects `!session.subscription` and creates a `purchases` row
8. User lands back at `/marketplace/:id?success=true`, which shows a success toast

---

## Files

| File | Action |
|------|--------|
| `supabase/functions/create-checkout-session/index.ts` | Create |
| `supabase/functions/stripe-webhook/handlers/checkout-webhook.ts` | Update |
| `src/hooks/useMarketplaceCheckout.ts` | Create |
| `src/pages/ProductDetail.tsx` | Update |

---

## Edge Function: `create-checkout-session`

**Pattern:** Matches existing edge functions (Deno, `serve`, Bearer auth, same Stripe key fallback chain).

**Request body:**
```ts
{ productId: string }
```

**Steps:**
1. Validate `Authorization` header → get `user.id` and `user.email` via `supabaseAuthClient.auth.getUser(token)`
2. Fetch product from `digital_products` using `supabaseServiceClient`:
   ```sql
   SELECT id, title, price, creator_id FROM digital_products WHERE id = $productId AND status = 'published'
   ```
3. Guard: if `product.creator_id === user.id` → throw `"You cannot purchase your own product"`
4. Convert price: `amountCents = Math.round(product.price * 100)`
5. Create Stripe CheckoutSession:
   ```ts
   stripe.checkout.sessions.create({
     mode: 'payment',
     payment_method_types: ['card'],
     line_items: [{
       price_data: {
         currency: 'usd',
         unit_amount: amountCents,
         product_data: { name: product.title },
       },
       quantity: 1,
     }],
     customer_email: user.email,
     metadata: {
       product_id: product.id,
       buyer_id: user.id,
       creator_id: product.creator_id,
     },
     success_url: `${origin}/marketplace/${productId}?success=true`,
     cancel_url: `${origin}/marketplace/${productId}`,
   })
   ```
   Where `origin` is read from the `Origin` request header (fallback: `https://fanrealms.com`).
6. Return `{ url: session.url }`

**Stripe key fallback chain** (matches existing functions, including the known typo):
```ts
Deno.env.get("STRIPE_SECERT_KEY_SANDBOX") ||
Deno.env.get("STRIPE_SECRET_KEY_SANDBOX") ||
Deno.env.get("STRIPE_SECRET_KEY_TEST") ||
Deno.env.get("STRIPE_SECRET_KEY") ||
Deno.env.get("STRIPE_SECRET_KEY_LIVE") || ""
```

---

## Webhook Update: `checkout-webhook.ts`

Replace the early-return `if (!session.subscription)` with a branch:

```ts
if (!session.subscription) {
  // One-time marketplace purchase
  const { product_id, buyer_id, creator_id } = session.metadata ?? {};
  if (!product_id || !buyer_id || !creator_id) {
    console.log('[CheckoutHandler] Missing metadata for one-time purchase, skipping');
    return createJsonResponse({ success: true });
  }

  const { data: product } = await supabaseService
    .from('digital_products')
    .select('price')
    .eq('id', product_id)
    .maybeSingle();

  const amount = product?.price ?? 0;
  const platformFee = parseFloat((amount * 0.1).toFixed(2));   // 10% platform fee
  const netAmount = parseFloat((amount - platformFee).toFixed(2));

  const { error } = await supabaseService.from('purchases').insert({
    buyer_id,
    product_id,
    creator_id,
    amount,
    platform_fee: platformFee,
    net_amount: netAmount,
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent ?? null,
    status: 'completed',
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
  console.log('[CheckoutHandler] One-time purchase recorded:', product_id);
  return createJsonResponse({ success: true });
}
// ... existing subscription branch continues unchanged below
```

---

## Hook: `useMarketplaceCheckout`

```ts
// src/hooks/useMarketplaceCheckout.ts
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useMarketplaceCheckout() {
  const [isLoading, setIsLoading] = useState(false);

  async function checkout(productId: string) {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('You must be logged in to purchase');

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { productId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL returned');

      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message ?? 'Checkout failed. Please try again.');
      setIsLoading(false);
    }
  }

  return { checkout, isLoading };
}
```

---

## ProductDetail.tsx Updates

1. Import hook: `import { useMarketplaceCheckout } from '@/hooks/useMarketplaceCheckout';`
2. Import `useSearchParams` from `react-router-dom` and `useEffect` from `react`
3. Show success toast when `?success=true` is in the URL:
   ```ts
   const [searchParams] = useSearchParams();
   useEffect(() => {
     if (searchParams.get('success') === 'true') {
       toast.success('Purchase complete! Check your email for your download link.');
     }
   }, []);
   ```
4. Wire the button:
   ```tsx
   const { checkout, isLoading } = useMarketplaceCheckout();
   // ...
   <Button
     size="lg"
     className="w-full"
     onClick={() => checkout(product.id)}
     disabled={isLoading}
   >
     {isLoading ? 'Redirecting to checkout…' : `Buy Now — $${product.price.toFixed(2)}`}
   </Button>
   ```
5. Remove the placeholder `<p>` tag below the button.

---

## Out of Scope

- **Stripe Connect transfer to creator** — the `net_amount` is recorded but the actual payout split is deferred to a follow-up task
- **Duplicate purchase guard** — checking if user already bought the product before creating a session
- **Download delivery** — sending the file/download link after purchase
- **Refunds** — handled by the existing `manual-refund-commission` pattern, not wired to products yet

---

## Self-Review

- ✅ No TBDs or placeholders
- ✅ Matches existing edge function patterns (Deno, Stripe key chain, CORS headers)
- ✅ Webhook branch is additive — existing subscription logic untouched
- ✅ Hook matches commission payment pattern
- ✅ `purchases` table schema respected (all non-null fields covered)
- ✅ Focused scope — 4 files, no unrelated changes
