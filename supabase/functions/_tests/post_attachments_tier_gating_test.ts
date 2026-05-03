// E2E test: post-attachments storage policy enforces per-tier gating.
// Seeds creator + 2 tiers + 3 posts + 4 users, asserts storage access matrix, cleans up.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const BUCKET = "post-attachments";
const PASSWORD = "TestPass!" + crypto.randomUUID();
const SUFFIX = crypto.randomUUID().slice(0, 8);

interface Ctx {
  admin: ReturnType<typeof createClient>;
  creatorUserId: string;
  creatorId: string;
  bronzeTierId: string;
  goldTierId: string;
  bronzeUserId: string;
  goldUserId: string;
  strangerUserId: string;
  publicPath: string;
  bronzePath: string;
  goldPath: string;
  publicPostId: string;
  bronzePostId: string;
  goldPostId: string;
  emails: { bronze: string; gold: string; stranger: string; creator: string };
}

async function createUser(admin: ReturnType<typeof createClient>, email: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return data.user!.id;
}

async function setup(): Promise<Ctx> {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const emails = {
    creator: `creator-${SUFFIX}@tiergate.test`,
    bronze: `bronze-${SUFFIX}@tiergate.test`,
    gold: `gold-${SUFFIX}@tiergate.test`,
    stranger: `stranger-${SUFFIX}@tiergate.test`,
  };

  const creatorUserId = await createUser(admin, emails.creator);
  const bronzeUserId = await createUser(admin, emails.bronze);
  const goldUserId = await createUser(admin, emails.gold);
  const strangerUserId = await createUser(admin, emails.stranger);

  // Ensure username on public.users (trigger auto-creates row, but username may need setting)
  await admin.from("users").upsert(
    [
      { id: creatorUserId, username: `creator_${SUFFIX}` },
      { id: bronzeUserId, username: `bronze_${SUFFIX}` },
      { id: goldUserId, username: `gold_${SUFFIX}` },
      { id: strangerUserId, username: `stranger_${SUFFIX}` },
    ],
    { onConflict: "id" },
  );

  const { data: creator, error: cErr } = await admin
    .from("creators")
    .insert({ user_id: creatorUserId, username: `creator_${SUFFIX}`, display_name: `TG ${SUFFIX}` })
    .select("id")
    .single();
  if (cErr) throw new Error(`insert creator: ${cErr.message}`);
  const creatorId = creator!.id as string;

  const { data: tiers, error: tErr } = await admin
    .from("membership_tiers")
    .insert([
      { creator_id: creatorId, title: `Bronze ${SUFFIX}`, description: "b", price: 5 },
      { creator_id: creatorId, title: `Gold ${SUFFIX}`, description: "g", price: 20 },
    ])
    .select("id, title");
  if (tErr) throw new Error(`insert tiers: ${tErr.message}`);
  const bronzeTierId = tiers!.find((t: any) => t.title.startsWith("Bronze"))!.id as string;
  const goldTierId = tiers!.find((t: any) => t.title.startsWith("Gold"))!.id as string;

  // Active subscriptions
  const { error: subErr } = await admin.from("user_subscriptions").insert([
    { user_id: bronzeUserId, creator_id: creatorId, tier_id: bronzeTierId, status: "active", amount: 5,
      current_period_end: new Date(Date.now() + 30 * 86400_000).toISOString() },
    { user_id: goldUserId, creator_id: creatorId, tier_id: goldTierId, status: "active", amount: 20,
      current_period_end: new Date(Date.now() + 30 * 86400_000).toISOString() },
  ]);
  if (subErr) throw new Error(`insert subs: ${subErr.message}`);

  // Upload three files into the creator's user-id folder (matches storage.foldername pattern)
  const folder = creatorUserId;
  const publicPath = `${folder}/tg-${SUFFIX}-public.txt`;
  const bronzePath = `${folder}/tg-${SUFFIX}-bronze.txt`;
  const goldPath = `${folder}/tg-${SUFFIX}-gold.txt`;
  for (const p of [publicPath, bronzePath, goldPath]) {
    const { error } = await admin.storage.from(BUCKET).upload(p, new Blob([`hello ${p}`]), {
      contentType: "text/plain", upsert: true,
    });
    if (error) throw new Error(`upload ${p}: ${error.message}`);
  }

  // Three posts. attachments column: jsonb array of strings (paths).
  const { data: posts, error: pErr } = await admin
    .from("posts")
    .insert([
      { author_id: creatorUserId, creator_id: creatorId, title: `pub-${SUFFIX}`, content: "x",
        tier_id: null, attachments: [publicPath] },
      { author_id: creatorUserId, creator_id: creatorId, title: `bro-${SUFFIX}`, content: "x",
        tier_id: bronzeTierId, attachments: [bronzePath] },
      { author_id: creatorUserId, creator_id: creatorId, title: `gld-${SUFFIX}`, content: "x",
        tier_id: goldTierId, attachments: [goldPath] },
    ])
    .select("id, title");
  if (pErr) throw new Error(`insert posts: ${pErr.message}`);
  const publicPostId = posts!.find((p: any) => p.title.startsWith("pub"))!.id as string;
  const bronzePostId = posts!.find((p: any) => p.title.startsWith("bro"))!.id as string;
  const goldPostId = posts!.find((p: any) => p.title.startsWith("gld"))!.id as string;

  return {
    admin, creatorUserId, creatorId, bronzeTierId, goldTierId,
    bronzeUserId, goldUserId, strangerUserId,
    publicPath, bronzePath, goldPath,
    publicPostId, bronzePostId, goldPostId, emails,
  };
}

async function teardown(ctx: Ctx) {
  const a = ctx.admin;
  await a.from("posts").delete().in("id", [ctx.publicPostId, ctx.bronzePostId, ctx.goldPostId]);
  await a.storage.from(BUCKET).remove([ctx.publicPath, ctx.bronzePath, ctx.goldPath]);
  await a.from("user_subscriptions").delete().eq("creator_id", ctx.creatorId);
  await a.from("membership_tiers").delete().eq("creator_id", ctx.creatorId);
  await a.from("creators").delete().eq("id", ctx.creatorId);
  for (const uid of [ctx.bronzeUserId, ctx.goldUserId, ctx.strangerUserId, ctx.creatorUserId]) {
    await a.auth.admin.deleteUser(uid).catch(() => {});
  }
}

async function tryDownload(email: string | null, path: string): Promise<"allow" | "deny"> {
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  if (email) {
    const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
    if (error) throw new Error(`signIn ${email}: ${error.message}`);
  }
  const { data, error } = await client.storage.from(BUCKET).download(path);
  if (error || !data) return "deny";
  await data.text(); // consume body
  return "allow";
}

Deno.test("post-attachments tier gating end-to-end", async () => {
  const ctx = await setup();
  try {
    const { emails, publicPath, bronzePath, goldPath } = ctx;

    const matrix: Array<[string, string | null, string, "allow" | "deny"]> = [
      // [label, email-or-null, path, expected]
      ["anon-public", null, publicPath, "deny"],
      ["anon-bronze", null, bronzePath, "deny"],
      ["anon-gold", null, goldPath, "deny"],

      ["stranger-public", emails.stranger, publicPath, "deny"],
      ["stranger-bronze", emails.stranger, bronzePath, "deny"],
      ["stranger-gold", emails.stranger, goldPath, "deny"],

      ["bronze-public", emails.bronze, publicPath, "allow"],
      ["bronze-bronze", emails.bronze, bronzePath, "allow"],
      ["bronze-gold", emails.bronze, goldPath, "deny"],

      ["gold-public", emails.gold, publicPath, "allow"],
      ["gold-bronze", emails.gold, bronzePath, "deny"], // gold !== bronze tier
      ["gold-gold", emails.gold, goldPath, "allow"],

      ["creator-public", emails.creator, publicPath, "allow"],
      ["creator-bronze", emails.creator, bronzePath, "allow"],
      ["creator-gold", emails.creator, goldPath, "allow"],
    ];

    const results: Record<string, string> = {};
    for (const [label, email, path, expected] of matrix) {
      const actual = await tryDownload(email, path);
      results[label] = `${actual} (want ${expected})`;
    }
    console.log("RESULT MATRIX:", JSON.stringify(results, null, 2));

    for (const [label, email, path, expected] of matrix) {
      const actual = await tryDownload(email, path);
      assertEquals(actual, expected, `${label}: expected ${expected} got ${actual}`);
    }
  } finally {
    await teardown(ctx);
  }
});
