import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/cors.ts";

const ALLOWED_ORIGINS = [
  "https://fanrealms.com",
  "https://www.fanrealms.com",
  "https://fanrealms-universe-access.lovable.app",
];
const DEFAULT_ORIGIN = "https://fanrealms.com";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const stripeSecret =
    Deno.env.get("STRIPE_SECRET_KEY") ||
    Deno.env.get("STRIPE_SECRET_KEY_LIVE") ||
    Deno.env.get("STRIPE_SECRET_KEY_TEST") ||
    Deno.env.get("STRIPE_SECERT_KEY_SANDBOX") ||
    Deno.env.get("STRIPE_SECRET_KEY_SANDBOX") ||
    "";

  if (!stripeSecret) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) throw new Error("Missing Authorization");
    const token = authHeader.replace("Bearer ", "");

    const anon = createClient(supabaseUrl, supabaseAnon, { auth: { persistSession: false } });
    const { data: authData, error: authError } = await anon.auth.getUser(token);
    if (authError || !authData.user) throw new Error("Unauthorized");
    const user = authData.user;

    const body = await req.json().catch(() => ({}));
    const bundleId: string | undefined = body?.bundleId;
    if (!bundleId || !UUID_RE.test(bundleId)) throw new Error("Invalid bundleId");

    const service = createClient(supabaseUrl, supabaseService, { auth: { persistSession: false } });

    const { data: bundle, error: bundleErr } = await service
      .from("bundles")
      .select("id, title, description, bundle_price, cover_image_url, status, creator_id, creators(user_id)")
      .eq("id", bundleId)
      .eq("status", "published")
      .maybeSingle();
    if (bundleErr) throw bundleErr;
    if (!bundle) throw new Error("Bundle not found");

    const creatorUserId = (bundle.creators as any)?.user_id;
    if (creatorUserId && creatorUserId === user.id) {
      throw new Error("You cannot purchase your own bundle");
    }

    const amountCents = Number(bundle.bundle_price);
    if (!Number.isFinite(amountCents) || amountCents < 50) {
      throw new Error("Bundle price below Stripe minimum ($0.50)");
    }

    // Already purchased?
    const { data: existing } = await service
      .from("bundle_purchases")
      .select("id")
      .eq("bundle_id", bundleId)
      .eq("buyer_id", user.id)
      .maybeSingle();
    if (existing) throw new Error("You already own this bundle");

    const { data: creatorRow } = await service
      .from("creators")
      .select("platform_fee_rate")
      .eq("id", bundle.creator_id)
      .maybeSingle();
    const { data: stripeAccount } = await service
      .from("creator_stripe_accounts")
      .select("stripe_account_id, stripe_charges_enabled")
      .eq("creator_id", bundle.creator_id)
      .maybeSingle();

    const feeRate = Math.min(Math.max(creatorRow?.platform_fee_rate ?? 5, 1), 5);
    const hasConnect = !!stripeAccount?.stripe_charges_enabled && !!stripeAccount?.stripe_account_id;
    const applicationFeeAmount = hasConnect ? Math.round(amountCents * feeRate / 100) : 0;

    const requestOrigin = req.headers.get("Origin") ?? "";
    const origin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : DEFAULT_ORIGIN;

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    const params: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `Bundle: ${bundle.title}`,
            description: bundle.description || undefined,
            images: bundle.cover_image_url ? [bundle.cover_image_url] : undefined,
          },
        },
        quantity: 1,
      }],
      customer_email: user.email,
      metadata: {
        bundle_id: bundle.id,
        buyer_id: user.id,
        creator_id: bundle.creator_id,
        kind: "bundle",
      },
      success_url: `${origin}/library?bundle_id=${bundle.id}`,
      cancel_url: `${origin}/bundles/${bundle.id}`,
    };

    if (hasConnect) {
      params.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: { destination: stripeAccount.stripe_account_id },
      };
    }

    const session = await stripe.checkout.sessions.create(params);
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[create-bundle-checkout]", err?.message);
    // Allowlist of safe, user-facing validation messages. Any other error is masked.
    const safeMessages = new Set([
      "Missing Authorization",
      "Unauthorized",
      "Invalid bundleId",
      "Bundle not found",
      "You cannot purchase your own bundle",
      "Bundle price below Stripe minimum ($0.50)",
      "You already own this bundle",
    ]);
    const message = safeMessages.has(err?.message)
      ? err.message
      : "Checkout failed. Please try again.";
    return new Response(JSON.stringify({ error: message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
