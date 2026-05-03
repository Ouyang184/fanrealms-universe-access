// E2E test: post-attachments storage policy enforces per-tier gating.
// Uses _tier-gating-seed edge function for setup/teardown (needs service role).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
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

async function tryDownload(tokenHash: string | null, path: string): Promise<"allow" | "deny"> {
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  if (tokenHash) {
    const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
    if (error) return "deny";
  }
  const { data, error } = await client.storage.from("post-attachments").download(path);
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
      const matrix: Array<[string, string | null, string, "allow" | "deny"]> = [
        ["anon-public",   null,                 publicPath, "deny"],
        ["anon-bronze",   null,                 bronzePath, "deny"],
        ["anon-gold",     null,                 goldPath,   "deny"],

        ["stranger-public", stranger.token_hash, publicPath, "deny"],
        ["stranger-bronze", stranger.token_hash, bronzePath, "deny"],
        ["stranger-gold",   stranger.token_hash, goldPath,   "deny"],

        ["bronze-public", bronze.token_hash,    publicPath, "allow"],
        ["bronze-bronze", bronze.token_hash,    bronzePath, "allow"],
        ["bronze-gold",   bronze.token_hash,    goldPath,   "deny"],

        ["gold-public",   gold.token_hash,      publicPath, "allow"],
        ["gold-bronze",   gold.token_hash,      bronzePath, "deny"],
        ["gold-gold",     gold.token_hash,      goldPath,   "allow"],

        ["creator-public", creator.token_hash,  publicPath, "allow"],
        ["creator-bronze", creator.token_hash,  bronzePath, "allow"],
        ["creator-gold",   creator.token_hash,  goldPath,   "allow"],
      ];

      const results: Record<string, string> = {};
      const failures: string[] = [];
      for (const [label, tok, path, expected] of matrix) {
        const actual = await tryDownload(tok, path);
        results[label] = `${actual} (want ${expected})`;
        if (actual !== expected) failures.push(`${label}: got ${actual}, expected ${expected}`);
      }
      console.log("RESULT MATRIX:\n" + Object.entries(results).map(([k, v]) => `  ${k}: ${v}`).join("\n"));

      if (failures.length) throw new Error("Failures:\n" + failures.join("\n"));
      assertEquals(failures.length, 0);
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
