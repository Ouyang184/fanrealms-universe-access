// E2E test: post-attachments storage policy enforces per-tier gating.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

async function callSeed(action: "setup" | "teardown", payload: Record<string, unknown> = {}) {
  const res = await fetch(`${FUNCTIONS_URL}/tier-gating-seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ action, ...payload }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`seed ${action} ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function loginClient(tokenHash: string) {
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (error) throw new Error(`verifyOtp: ${error.message}`);
  if (!data.session) throw new Error("no session from verifyOtp");
  return client;
}

async function tryDownload(client: ReturnType<typeof createClient> | null, path: string): Promise<"allow" | "deny"> {
  const c = client ?? createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await c.storage.from("post-attachments").download(path);
  if (error || !data) return "deny";
  await data.text();
  return "allow";
}

Deno.test({
  name: "post-attachments tier gating end-to-end",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const ctx = await callSeed("setup");
    const { creator, bronze, gold, stranger, publicPath, bronzePath, goldPath } = ctx;

    try {
      // One client per user (token_hash is single-use)
      const creatorC = await loginClient(creator.token_hash);
      const bronzeC = await loginClient(bronze.token_hash);
      const goldC = await loginClient(gold.token_hash);
      const strangerC = await loginClient(stranger.token_hash);

      const matrix: Array<[string, ReturnType<typeof createClient> | null, string, "allow" | "deny"]> = [
        ["anon-public",   null,      publicPath, "deny"],
        ["anon-bronze",   null,      bronzePath, "deny"],
        ["anon-gold",     null,      goldPath,   "deny"],

        // Public posts are accessible to any authenticated user (correct & expected)
        ["stranger-public", strangerC, publicPath, "allow"],
        ["stranger-bronze", strangerC, bronzePath, "deny"],
        ["stranger-gold",   strangerC, goldPath,   "deny"],

        ["bronze-public", bronzeC,   publicPath, "allow"],
        ["bronze-bronze", bronzeC,   bronzePath, "allow"],
        ["bronze-gold",   bronzeC,   goldPath,   "deny"], // KEY: low-tier blocked from high-tier file

        ["gold-public",   goldC,     publicPath, "allow"],
        ["gold-bronze",   goldC,     bronzePath, "deny"], // KEY: gold-only sub doesn't get bronze-only file
        ["gold-gold",     goldC,     goldPath,   "allow"],

        ["creator-public", creatorC, publicPath, "allow"],
        ["creator-bronze", creatorC, bronzePath, "allow"], // owner of folder
        ["creator-gold",   creatorC, goldPath,   "allow"],
      ];

      const results: Record<string, string> = {};
      const failures: string[] = [];
      for (const [label, client, path, expected] of matrix) {
        const actual = await tryDownload(client, path);
        results[label] = `${actual} (want ${expected})`;
        if (actual !== expected) failures.push(`${label}: got ${actual}, expected ${expected}`);
      }
      console.log("RESULT MATRIX:\n" + Object.entries(results).map(([k, v]) => `  ${k}: ${v}`).join("\n"));

      if (failures.length) throw new Error("Failures:\n" + failures.join("\n"));
    } finally {
      await callSeed("teardown", {
        creatorId: ctx.creatorId,
        postIds: ctx.postIds,
        paths: [publicPath, bronzePath, goldPath],
        userIds: [bronze.id, gold.id, stranger.id, creator.id],
      }).catch((e) => console.error("teardown failed:", e.message));
    }
  },
});
