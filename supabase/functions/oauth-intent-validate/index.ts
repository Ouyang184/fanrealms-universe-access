// Validates that the OAuth intent (signup vs login) matches reality.
// - intent=signup + existing user => returns { error: 'account_exists' }
// - intent=login + new user       => deletes the just-created auth user, returns { error: 'no_account' }
// - matching intent               => returns { ok: true }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return json({ error: "missing_token" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const intent = body?.intent;
    if (intent !== "signup" && intent !== "login") {
      return json({ error: "invalid_intent" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Identify the caller from their JWT
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json({ error: "invalid_token" }, 401);
    }
    const user = userData.user;

    // Detect "just created" by comparing created_at vs last_sign_in_at + age window
    const createdAtMs = new Date(user.created_at).getTime();
    const lastSignInMs = user.last_sign_in_at
      ? new Date(user.last_sign_in_at).getTime()
      : createdAtMs;
    const ageMs = Date.now() - createdAtMs;
    // "New user" = created within the last 2 minutes AND no prior sign-in
    const isNewUser =
      ageMs < 2 * 60 * 1000 &&
      Math.abs(lastSignInMs - createdAtMs) < 5_000;

    if (intent === "signup" && !isNewUser) {
      return json({ error: "account_exists" }, 200);
    }

    if (intent === "login" && isNewUser) {
      // Hard-delete the just-created auth user so they can sign up cleanly later.
      // Safe because we verified age < 2min AND no prior sign-in.
      await admin.auth.admin.deleteUser(user.id);
      return json({ error: "no_account" }, 200);
    }

    return json({ ok: true, isNewUser }, 200);
  } catch (err) {
    console.error("[oauth-intent-validate] error", err);
    return json({ error: "internal_error" }, 500);
  }
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
