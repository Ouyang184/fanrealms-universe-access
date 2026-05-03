# Plan: End-to-End Test for Post Attachment Tier Gating

## Goal
Prove the new `user_can_access_post_attachment` policy actually denies low-tier subscribers access to high-tier post attachments, and allows the right cases — using a self-contained Deno test that seeds, asserts, and cleans up.

## Approach
Create a Deno test at `supabase/functions/_tests/post_attachments_tier_gating_test.ts` that runs against the live Supabase project using the service role key for setup/teardown, and the anon key + per-user JWTs to exercise the storage policy as real users.

## Test Matrix

For one synthetic creator with two tiers (Bronze, Gold) and three posts (public, Bronze-only, Gold-only):

| Caller | Public file | Bronze file | Gold file | Expected |
|---|---|---|---|---|
| Anonymous | deny | deny | deny | all 401/403 |
| Bronze subscriber | allow | allow | deny | gold blocked |
| Gold subscriber | allow | allow* | allow | full access |
| Creator (owner) | allow | allow | allow | always |
| Unrelated user | deny | deny | deny | all blocked |

*Gold tier holder also gets Bronze content only if the post lists Gold (via `post_tiers`) or Gold = Bronze tier on the post — we will explicitly test the documented rule: "subscriber must hold the specific tier on that post." If Gold ≠ Bronze and the Bronze post is gated to Bronze only, Gold subscriber is denied. We'll assert that exact behavior.

## Steps

1. **Setup (service role)**
   - Create one creator row + corresponding `auth.users` entry (via `supabase.auth.admin.createUser`).
   - Create two `membership_tiers`: Bronze, Gold.
   - Create three `auth.users`: bronzeUser, goldUser, strangerUser.
   - Insert active `user_subscriptions` for bronzeUser→Bronze and goldUser→Gold.
   - Upload three placeholder files to `post-attachments/<creator_id>/test-public.txt`, `test-bronze.txt`, `test-gold.txt`.
   - Insert three `posts` rows referencing those file paths in `attachments` jsonb, with `tier_id` set to NULL / Bronze / Gold respectively.

2. **Assertions** — for each caller, `signInWithPassword` to get a JWT, then call `storage.from('post-attachments').createSignedUrl(path, 60)` (or `.download()`) and assert allowed/denied per the matrix above.

3. **Teardown (always runs in `finally`)**
   - Delete posts, subscriptions, tiers, storage objects, creator row, and the four test users.

## Technical Details

- File: `supabase/functions/_tests/post_attachments_tier_gating_test.ts`
- Imports: `Deno.test`, `assertEquals`, `@supabase/supabase-js`, `dotenv/load.ts`.
- Requires secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (already in `.env`), and `SUPABASE_SERVICE_ROLE_KEY` (already configured as edge function secret — confirm it's readable from the test runner; if not, fall back to seeding via a one-shot edge function helper).
- Always consume response bodies (`await res.text()`).
- Use unique suffix (`crypto.randomUUID()`) on emails/file names so re-runs don't collide.
- Test uses `try/finally` so cleanup runs even on assertion failure.

## Deliverables

- New test file (no production code changes).
- Test runs via `supabase--test_edge_functions` with `{"functions": ["_tests"]}` or a name pattern.
- I'll execute the test after creating it and report pass/fail per row of the matrix.

## Risks / Notes

- If `SUPABASE_SERVICE_ROLE_KEY` isn't available to the Deno test runner, I'll need to add a minimal `_test-seed` edge function that performs setup/teardown server-side and is invoked by the test. I'll know after the first run.
- Test creates and deletes real auth users in the live project (cleaned up immediately). No real user data is touched.
