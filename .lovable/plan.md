## Diagnosis

The database cleanup worked for `public.users`: there are now **0 orphan profile rows**, the `users_id_fkey` cascade constraint exists, and the `handle_new_auth_user` trigger is hardened.

The remaining issue is a different auth-state problem:

- There are still **2 orphan rows in `auth.identities`** that point to deleted `auth.users` rows.
- The current callback screen displays provider/session errors using a generic **“Sign-in issue / User not found / Back to login”** message, even when the user started from Signup.
- The signup intent is currently stored only in `sessionStorage`, which can be unreliable across OAuth redirects and canonical host hops.
- The deployed `oauth-intent-validate` function has no recent logs, so the failure is happening before that validation function is reached.

## Plan

1. **Clean remaining broken Supabase auth identity data**
   - Remove orphan rows from `auth.identities` where the referenced auth user no longer exists.
   - This is the likely remaining data conflict behind Supabase returning `User not found` during Google signup.

2. **Make OAuth intent survive redirects**
   - Store `oauth_intent` in `localStorage` alongside the existing return path, not only `sessionStorage`.
   - Include the intent in the callback URL query string as a fallback.
   - Preserve the correct intent when redirecting from `www.fanrealms.com` to `fanrealms.com`; right now that canonical hop always goes through `/login`, which can overwrite Signup intent.

3. **Fix the callback copy and redirect behavior**
   - If the user started from Signup and Supabase returns `User not found`, show a signup-specific message instead of “Sign-in issue”.
   - Send signup failures back to `/signup`, not `/login`.
   - Keep login failures pointing to `/login`.

4. **Add lightweight diagnostic logging in the callback**
   - Log the detected OAuth intent, whether a provider error was returned, and whether a session was established.
   - Avoid logging tokens or secrets.

5. **Validate after changes**
   - Re-check the orphan identity count is 0.
   - Confirm the callback reads signup intent correctly from the Signup Google button path.
   - Check Edge Function/auth logs if the issue still appears after the cleanup.

## Files expected to change

- `src/components/auth/SocialLoginOptions.tsx`
- `src/pages/AuthCallback.tsx`
- `src/utils/oauth-storage.ts`

## Database operation

- Delete orphan rows from `auth.identities` that have no matching `auth.users` row.