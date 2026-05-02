## Why Google sign-up is failing

Investigation found two real problems and one UX gap:

**Problem 1 — Orphan profile rows are blocking signups (root cause of "User not found").**
`public.users` has 13 rows but `auth.users` has only 10. Three profile rows exist with no matching auth user:
- `agoniamoejdusi@gmail.com`
- `jake.yanouyang@gmail.com`
- `jack520088@gmail.com`

The `public.users` table has `UNIQUE (email)`. When someone signs up via Google with one of those emails, the `handle_new_auth_user` trigger tries to insert a profile row, hits the unique-email violation, the EXCEPTION handler swallows it — but the auth-user record is then in a half-provisioned state and Supabase surfaces it as `User not found` on the redirect back. (Likely your test account is `jake.yanouyang@gmail.com`.)

**Problem 2 — How OAuth actually works (important UX context).**
Supabase's `signInWithOAuth` is a single endpoint that auto-creates accounts when "Allow new sign-ups" is on. It does **not** distinguish "I want to sign up" from "I want to sign in". You asked for **strict separation** between Login and Sign-up Google buttons — that requires custom logic on our side, because Supabase won't enforce it natively.

**Problem 3 — Trigger fragility.**
`handle_new_auth_user` swallows all exceptions silently. We have no way to see why a signup failed in production. Needs structured logging.

---

## Plan

### 1. Database cleanup + hardened trigger (migration)
- Delete the 3 orphan rows in `public.users` that have no matching `auth.users` entry. (These belong to deleted/never-completed accounts; safe to remove.)
- Add a one-time guard so future deletes from `auth.users` cascade properly: add `ON DELETE CASCADE` from `public.users.id` → `auth.users.id` (currently no FK exists, which is why orphans accumulate).
- Rewrite `handle_new_auth_user` to:
  - Detect email-collision against orphan rows and reclaim the row (update its `id` to match `NEW.id`) instead of failing.
  - Write to a small `public.auth_trigger_errors` log table on any unexpected failure (id, email, sqlstate, sqlerrm, occurred_at) so we can see future failures in the dashboard. Still `RETURN NEW` to avoid blocking auth.

### 2. Strict Sign-up vs Sign-in separation (edge function + UI)

Because Supabase can't enforce this, we'll do a **pre-check** before launching the OAuth redirect:

- New edge function `oauth-precheck` (public, no JWT required): accepts `{ email?, mode: 'signup' | 'login' }`. For OAuth we don't have email up front, so this function will be called from the **callback** after OAuth returns, before we commit the session.
- Actual flow:
  1. User clicks "Continue with Google" on **Sign-up** page → we set `sessionStorage.oauth_intent = 'signup'` then launch OAuth.
  2. User clicks "Continue with Google" on **Login** page → we set `sessionStorage.oauth_intent = 'login'` then launch OAuth.
  3. After Google redirects back to `/auth/callback`, the SDK exchanges the code and we get a session with the user's email + a flag for whether the auth user was just created (we'll detect this by checking `created_at` vs `last_sign_in_at` from `auth.users` via the edge function using service role).
  4. Edge function `oauth-precheck` (rename to `oauth-intent-validate`) compares `intent` vs `is_new_user`:
     - `intent=signup` + existing user → sign them out, return `{ error: 'account_exists' }`. UI shows "An account already exists for this Google address. Please log in instead." with a button to `/login`.
     - `intent=login` + new user → sign them out **and delete the just-created auth user** (service-role call), return `{ error: 'no_account' }`. UI shows "No account found for this Google address. Please sign up first." with a button to `/signup`.
     - Matching intent → proceed normally to `returnTo`.

### 3. UI updates
- `SocialLoginOptions.tsx` — accept a `mode: 'login' | 'signup'` prop, write it to sessionStorage before redirecting. Update Login.tsx and Signup.tsx to pass the right mode.
- `AuthCallback.tsx` — after session is established, call `oauth-intent-validate`, handle the three outcomes (success / account_exists / no_account) with the appropriate redirect + toast + on-page message.

### 4. Verification
- Re-query `public.users` vs `auth.users` counts — should match.
- Check the new `auth_trigger_errors` table is empty after a successful test signup.
- Manual test matrix:
  - New Gmail on Sign-up page → account created, lands on dashboard.
  - Same Gmail on Sign-up page again → "Account already exists" message, redirected to login.
  - Existing Gmail on Login page → signs in, lands on dashboard.
  - Brand-new Gmail on Login page → "No account found" message, redirected to signup, no orphan auth user left behind.

---

## Technical notes

- Migration is the only DB change; touches `public.users` (3 row deletes, FK add), `handle_new_auth_user` (rewrite), new `public.auth_trigger_errors` table with RLS allowing only service_role.
- `oauth-intent-validate` edge function uses `SUPABASE_SERVICE_ROLE_KEY` (already available) to (a) read `auth.users.created_at`/`last_sign_in_at` and (b) hard-delete a wrongly-created auth user when intent was login. Caller passes its own JWT for identification; function validates it.
- The "delete just-created auth user" step is gated by checking `created_at` is within the last 60 seconds AND `last_sign_in_at` is null/equal to `created_at`, so we can never accidentally nuke an established account.
- No changes to Supabase Auth dashboard settings required; "Allow new sign-ups" stays ON.

## Files touched
- New migration (orphan cleanup, FK, trigger rewrite, error log table)
- New `supabase/functions/oauth-intent-validate/index.ts`
- `src/components/auth/SocialLoginOptions.tsx` (add mode prop)
- `src/pages/Login.tsx` (pass `mode="login"`)
- `src/pages/Signup.tsx` (pass `mode="signup"`)
- `src/pages/AuthCallback.tsx` (call validator, handle outcomes)
