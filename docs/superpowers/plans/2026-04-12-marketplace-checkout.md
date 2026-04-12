# Marketplace One-Time Purchase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up Stripe Checkout (hosted redirect) for one-time digital product purchases so users can click "Buy Now" on a product page and be taken to a Stripe-hosted payment form.

**Architecture:** A new `create-checkout-session` Deno edge function creates a Stripe CheckoutSession and returns the hosted URL. The existing `stripe-webhook` handler is extended to record purchases when `checkout.session.completed` fires. A small React hook calls the edge function and redirects. `ProductDetail.tsx` consumes the hook.

**Tech Stack:** Deno 1.x, Stripe API (v14), Supabase Edge Functions, React 18, TypeScript, TanStack Query, sonner (toasts)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/create-checkout-session/index.ts` | Create | Deno edge function — creates a Stripe CheckoutSession for a product and returns `{ url }` |
| `supabase/functions/stripe-webhook/handlers/checkout-webhook.ts` | Modify | Add one-time purchase branch before the existing subscription branch |
| `src/hooks/useMarketplaceCheckout.ts` | Create | React hook — calls the edge function and redirects to Stripe URL |
| `src/pages/ProductDetail.tsx` | Modify | Wire the Buy Now button to the hook; show success toast on return |

---

## Task 1: Create `create-checkout-session` Edge Function

**Files:**
- Create: `supabase/functions/create-checkout-session/index.ts`

- [ ] **Step 1: Create the file**

Create `supabase/functions/create-checkout-session/index.ts` with the following complete contents:

```ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const stripeSecret =
    Deno.env.get("STRIPE_SECERT_KEY_SANDBOX") ||   // existing typo kept for compat
    Deno.env.get("STRIPE_SECRET_KEY_SANDBOX") ||
    Deno.env.get("STRIPE_SECRET_KEY_TEST") ||
    Deno.env.get("STRIPE_SECRET_KEY") ||
    Deno.env.get("STRIPE_SECRET_KEY_LIVE") ||
    "";

  if (!stripeSecret) {
    return new Response(
      JSON.stringify({ error: "Stripe secret key not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseAuthClient = createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false },
  });
  const supabaseServiceClient = createClient(supabaseUrl, supabaseService, {
    auth: { persistSession: false },
  });

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseAuthClient.auth.getUser(token);
    if (authError || !authData.user) throw new Error("User not authenticated");
    const user = authData.user;

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { productId } = body as { productId?: string };
    if (!productId) throw new Error("productId is required");

    // Fetch product (join creators to get creator's user_id for self-purchase guard)
    const { data: product, error: productError } = await supabaseServiceClient
      .from("digital_products")
      .select("id, title, price, creator_id, creators(user_id)")
      .eq("id", productId)
      .eq("status", "published")
      .maybeSingle();

    if (productError) throw productError;
    if (!product) throw new Error("Product not found or not published");

    // Self-purchase guard — compare auth user id to creator's user_id
    const creatorUserId = (product.creators as any)?.user_id;
    if (creatorUserId && creatorUserId === user.id) {
      throw new Error("You cannot purchase your own product");
    }

    // Convert price to cents
    const amountCents = Math.round(Number(product.price) * 100);
    if (amountCents < 50) throw new Error("Product price is below Stripe minimum ($0.50)");

    // Determine origin for redirect URLs
    const origin =
      req.headers.get("Origin") ||
      req.headers.get("Referer")?.replace(/\/$/, "") ||
      "https://fanrealms.com";

    // Create Stripe Checkout Session
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: { name: product.title },
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        product_id: product.id,
        buyer_id: user.id,
        creator_id: product.creator_id,   // creators.id (not auth.users.id)
      },
      success_url: `${origin}/marketplace/${productId}?success=true`,
      cancel_url: `${origin}/marketplace/${productId}`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[create-checkout-session] Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal server error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 2: Deploy the edge function**

```bash
cd "C:/Users/jakey/Claude Code/fanrealms-universe-access"
npx supabase functions deploy create-checkout-session --no-verify-jwt
```

Expected output: `Deployed Function create-checkout-session` (or similar success message).

> **Note:** `--no-verify-jwt` is used here because the function performs its own Bearer token auth. This matches the pattern used by other payment functions in this repo.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/create-checkout-session/
git commit -m "feat: add create-checkout-session edge function for marketplace purchases"
```

---

## Task 2: Update Checkout Webhook Handler

**Files:**
- Modify: `supabase/functions/stripe-webhook/handlers/checkout-webhook.ts`

- [ ] **Step 1: Read the current file**

Read `supabase/functions/stripe-webhook/handlers/checkout-webhook.ts`. The current early-return block is:

```ts
if (!session.subscription) {
  console.log('[CheckoutHandler] No subscription in session, skipping');
  return createJsonResponse({ success: true });
}
```

- [ ] **Step 2: Replace the early-return with a one-time purchase branch**

Replace that entire `if (!session.subscription)` block (the early return) with the following, leaving all code after it unchanged:

```ts
if (!session.subscription) {
  // One-time marketplace purchase
  console.log('[CheckoutHandler] No subscription — checking for one-time purchase metadata');
  const { product_id, buyer_id, creator_id } = session.metadata ?? {};

  if (!product_id || !buyer_id || !creator_id) {
    console.log('[CheckoutHandler] Missing metadata for one-time purchase, skipping');
    return createJsonResponse({ success: true });
  }

  // Fetch price from digital_products (source of truth)
  const { data: product, error: productFetchError } = await supabaseService
    .from('digital_products')
    .select('price')
    .eq('id', product_id)
    .maybeSingle();

  if (productFetchError) {
    console.error('[CheckoutHandler] Error fetching product:', productFetchError);
    throw productFetchError;
  }

  const amount = Number(product?.price ?? 0);
  const platformFee = parseFloat((amount * 0.1).toFixed(2));   // 10% platform fee
  const netAmount = parseFloat((amount - platformFee).toFixed(2));

  const { error: insertError } = await supabaseService.from('purchases').insert({
    buyer_id,
    product_id,
    creator_id,   // creators.id (FK to public.creators)
    amount,
    platform_fee: platformFee,
    net_amount: netAmount,
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent ?? null,
    status: 'completed',
  });

  if (insertError) {
    console.error('[CheckoutHandler] Error inserting purchase:', insertError);
    throw insertError;
  }

  console.log('[CheckoutHandler] One-time purchase recorded for product:', product_id);
  return createJsonResponse({ success: true });
}
```

- [ ] **Step 3: Deploy the updated webhook function**

```bash
cd "C:/Users/jakey/Claude Code/fanrealms-universe-access"
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

Expected: `Deployed Function stripe-webhook`

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/stripe-webhook/handlers/checkout-webhook.ts
git commit -m "feat: handle one-time marketplace purchases in checkout webhook"
```

---

## Task 3: Create `useMarketplaceCheckout` Hook

**Files:**
- Create: `src/hooks/useMarketplaceCheckout.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useMarketplaceCheckout.ts` with these complete contents:

```ts
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useMarketplaceCheckout() {
  const [isLoading, setIsLoading] = useState(false);

  async function checkout(productId: string) {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to purchase');
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { productId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw new Error(error.message ?? 'Failed to create checkout session');
      if (!data?.url) throw new Error('No checkout URL returned from server');

      // Redirect to Stripe-hosted checkout — no need to setIsLoading(false)
      // because the page is navigating away
      window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      toast.error(message);
      setIsLoading(false);
    }
  }

  return { checkout, isLoading };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "C:/Users/jakey/Claude Code/fanrealms-universe-access"
npm run build
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useMarketplaceCheckout.ts
git commit -m "feat: add useMarketplaceCheckout hook for Stripe Checkout redirect"
```

---

## Task 4: Wire Up ProductDetail.tsx

**Files:**
- Modify: `src/pages/ProductDetail.tsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/ProductDetail.tsx`. The current button block (near the bottom) is:

```tsx
<Button size="lg" className="w-full">
  Buy Now — ${product.price.toFixed(2)}
</Button>
<p className="text-xs text-center text-muted-foreground">
  Stripe checkout integration placeholder — connect your Stripe one-time payment flow here.
</p>
```

- [ ] **Step 2: Add imports**

At the top of `src/pages/ProductDetail.tsx`, add these imports alongside the existing ones:

```tsx
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useMarketplaceCheckout } from '@/hooks/useMarketplaceCheckout';
```

(`useParams` and `Link` are already imported — don't duplicate them.)

- [ ] **Step 3: Add hook calls inside the component**

Inside the `ProductDetail` component function, after the existing `const { data: product, isLoading } = useProduct(...)` line, add:

```tsx
const [searchParams] = useSearchParams();
const { checkout, isLoading: checkoutLoading } = useMarketplaceCheckout();

useEffect(() => {
  if (searchParams.get('success') === 'true') {
    toast.success('Purchase complete! Check your email for your download link.');
  }
}, []);
```

- [ ] **Step 4: Replace the placeholder button**

Replace this block:

```tsx
<Button size="lg" className="w-full">
  Buy Now — ${product.price.toFixed(2)}
</Button>
<p className="text-xs text-center text-muted-foreground">
  Stripe checkout integration placeholder — connect your Stripe one-time payment flow here.
</p>
```

With:

```tsx
<Button
  size="lg"
  className="w-full"
  onClick={() => checkout(product.id)}
  disabled={checkoutLoading}
>
  {checkoutLoading ? 'Redirecting to checkout…' : `Buy Now — $${product.price.toFixed(2)}`}
</Button>
```

- [ ] **Step 5: Build to verify no TypeScript errors**

```bash
cd "C:/Users/jakey/Claude Code/fanrealms-universe-access"
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/ProductDetail.tsx
git commit -m "feat: wire Buy Now button to Stripe Checkout on ProductDetail page"
```

---

## Task 5: Push and Smoke-Test

- [ ] **Step 1: Push all commits to main**

```bash
cd "C:/Users/jakey/Claude Code/fanrealms-universe-access"
git push origin main
```

- [ ] **Step 2: Smoke-test the checkout flow manually**

1. Log in to FanRealms as a user who does **not** own any products
2. Navigate to `/marketplace` and click a published product
3. Click **Buy Now** — the button should show "Redirecting to checkout…" briefly
4. You should be redirected to `checkout.stripe.com` with the correct product name and price
5. Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC
6. After payment, you should land back at `/marketplace/:id?success=true`
7. A toast should appear: "Purchase complete! Check your email for your download link."
8. In the Supabase dashboard, verify a row exists in `purchases` with `status = 'completed'`

- [ ] **Step 3: Verify webhook fired correctly**

In the Stripe dashboard → Developers → Webhooks → your endpoint → Recent events, confirm `checkout.session.completed` shows a `200` response.

---

## Self-Review

**Spec coverage:**
- ✅ Edge function creates CheckoutSession with correct metadata — Task 1
- ✅ Self-purchase guard (via `creators.user_id` join) — Task 1, Step 1
- ✅ Webhook handler creates `purchases` row — Task 2
- ✅ `useMarketplaceCheckout` hook — Task 3
- ✅ Button wired, loading state, success toast — Task 4
- ✅ Placeholder `<p>` removed — Task 4, Step 4

**Placeholder scan:** No TBDs, no "implement later", no "add validation" without code.

**Type consistency:**
- `checkout(productId: string)` defined in Task 3, called in Task 4 ✅
- `creator_id` is `creators.id` (FK to `public.creators`) throughout — noted in both Task 1 and Task 2 ✅
- `isLoading` returned from hook, consumed as `checkoutLoading` in Task 4 ✅
