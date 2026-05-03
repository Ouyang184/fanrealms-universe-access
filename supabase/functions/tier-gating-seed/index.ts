// Seeder/teardown for the post-attachments tier gating e2e test.
// Returns IDs needed by the test runner. NOT for production use.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "post-attachments";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    const body = await req.json();
    const action = body.action;

    if (action === "setup") {
      const suffix = crypto.randomUUID().slice(0, 8);
      const password = "TierGate!" + crypto.randomUUID();

      const mkUser = async (label: string) => {
        const email = `${label}-${suffix}@tiergate.test`;
        const { data, error } = await admin.auth.admin.createUser({
          email, password, email_confirm: true,
        });
        if (error) throw new Error(`${label}: ${error.message}`);
        return { id: data.user!.id, email };
      };

      const creator = await mkUser("creator");
      const bronze = await mkUser("bronze");
      const gold = await mkUser("gold");
      const stranger = await mkUser("stranger");

      await admin.from("users").upsert(
        [creator, bronze, gold, stranger].map((u, i) => ({
          id: u.id, username: `tg_${suffix}_${i}`,
        })),
        { onConflict: "id" },
      );

      const { data: cRow, error: cErr } = await admin.from("creators").insert({
        user_id: creator.id, username: `tg_creator_${suffix}`, display_name: `TG ${suffix}`,
      }).select("id").single();
      if (cErr) throw new Error(`creator: ${cErr.message}`);
      const creatorId = cRow.id;

      const { data: tiers, error: tErr } = await admin.from("membership_tiers").insert([
        { creator_id: creatorId, title: `Bronze-${suffix}`, description: "b", price: 5 },
        { creator_id: creatorId, title: `Gold-${suffix}`, description: "g", price: 20 },
      ]).select("id, title");
      if (tErr) throw new Error(`tiers: ${tErr.message}`);
      const bronzeTierId = tiers.find((t: any) => t.title.startsWith("Bronze")).id;
      const goldTierId = tiers.find((t: any) => t.title.startsWith("Gold")).id;

      const futureEnd = new Date(Date.now() + 30 * 86400_000).toISOString();
      const { error: subErr } = await admin.from("user_subscriptions").insert([
        { user_id: bronze.id, creator_id: creatorId, tier_id: bronzeTierId, status: "active", amount: 5, current_period_end: futureEnd },
        { user_id: gold.id, creator_id: creatorId, tier_id: goldTierId, status: "active", amount: 20, current_period_end: futureEnd },
      ]);
      if (subErr) throw new Error(`subs: ${subErr.message}`);

      const folder = creator.id;
      const publicPath = `${folder}/tg-${suffix}-public.txt`;
      const bronzePath = `${folder}/tg-${suffix}-bronze.txt`;
      const goldPath = `${folder}/tg-${suffix}-gold.txt`;
      for (const p of [publicPath, bronzePath, goldPath]) {
        const { error } = await admin.storage.from(BUCKET).upload(p, new Blob([`hi ${p}`]), { contentType: "text/plain", upsert: true });
        if (error) throw new Error(`upload ${p}: ${error.message}`);
      }

      const { data: posts, error: pErr } = await admin.from("posts").insert([
        { author_id: creator.id, creator_id: creatorId, title: `pub-${suffix}`, content: "x", tier_id: null, attachments: [publicPath] },
        { author_id: creator.id, creator_id: creatorId, title: `bro-${suffix}`, content: "x", tier_id: bronzeTierId, attachments: [bronzePath] },
        { author_id: creator.id, creator_id: creatorId, title: `gld-${suffix}`, content: "x", tier_id: goldTierId, attachments: [goldPath] },
      ]).select("id, title");
      if (pErr) throw new Error(`posts: ${pErr.message}`);

      return new Response(JSON.stringify({
        password, suffix,
        creator, bronze, gold, stranger,
        creatorId, bronzeTierId, goldTierId,
        publicPath, bronzePath, goldPath,
        postIds: posts.map((p: any) => p.id),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "teardown") {
      const { creatorId, postIds, paths, userIds } = body;
      await admin.from("posts").delete().in("id", postIds ?? []);
      if (paths?.length) await admin.storage.from(BUCKET).remove(paths);
      await admin.from("user_subscriptions").delete().eq("creator_id", creatorId);
      await admin.from("membership_tiers").delete().eq("creator_id", creatorId);
      await admin.from("creators").delete().eq("id", creatorId);
      for (const uid of userIds ?? []) {
        await admin.auth.admin.deleteUser(uid).catch(() => {});
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
