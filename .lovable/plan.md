## Goal

Fix "Continue with Google" on fanrealms.com so that clicking it reliably signs the user in.

## What's broken today

The current flow is unusually complex:

1. User clicks Google on `fanrealms.com`.
2. A popup opens pointed at `fanrealms-universe-access.lovable.app/oauth-popup` (the "relay origin").
3. The relay calls `supabase.auth.signInWithOAuth` — Supabase stores a PKCE `code_verifier` in **localStorage of the relay origin**.
4. Google redirects back to the relay's `/auth/callback?relay=true`.
5. The relay exchanges the code for a session, then `postMessage`s the session back to `fanrealms.com`.
6. `fanrealms.com` calls `supabase.auth.setSession({ access_token, refresh_token })` to log the user in on the main origin.

This was built to work around Cloudflare proxy issues on `fanrealms.com`. In practice the popup completes Google auth (auth logs show the redirect succeeds) but the session never lands on `fanrealms.com` — likely causes:

- The `session` object sent via `postMessage` is missing `refresh_token` (Supabase only returns it once during code exchange and structured-clone of the full session can drop nested fields), so `setSession` silently fails.
- Popup blockers / Safari ITP block cross-origin `postMessage` and third-party storage.
- Two separate Supabase localStorage entries (one per origin) get out of sync.

## Fix

Replace the popup-relay with a **standard same-origin OAuth redirect** on `fanrealms.com`. This is the supported Supabase pattern and removes every cross-origin moving part.

### What changes

1. **`SocialLoginOptions.tsx`** — replace `openOAuthPopup` with a direct call:
   ```ts
   await supabase.auth.signInWithOAuth({
     provider,
     options: { redirectTo: `${window.location.origin}/auth/callback` },
   });
   ```
   No popup, no relay origin, no postMessage. The browser navigates to Google and back.

2. **`AuthCallback.tsx`** — strip out all `relay` / `window.opener` / `postMessage` branches. Keep only:
   - PKCE code exchange (`exchangeCodeForSession`)
   - Recovery redirect
   - Navigate to `/dashboard` (or `returnTo`) on success, `/login` on failure

3. **`OAuthPopup.tsx`** — delete the file and remove its route from `App.tsx`.

### Supabase dashboard settings the user must verify

(I'll list these in chat after the code change so the user can confirm them in the Supabase dashboard — they cannot be changed from code):

- **Site URL**: `https://fanrealms.com`
- **Redirect URLs** (allow-list): add
  - `https://fanrealms.com/auth/callback`
  - `https://www.fanrealms.com/auth/callback`
  - `https://fanrealms-universe-access.lovable.app/auth/callback`
  - `https://id-preview--77a75b15-d40c-4de1-9a69-95e5c12211ff.lovable.app/auth/callback`
- **Google provider**: Client ID + Secret configured, and the Supabase callback URL `https://eaeqyctjljbtcatlohky.supabase.co/auth/v1/callback` is registered in Google Cloud Console as an Authorized redirect URI.

### Cloudflare note

The original popup workaround was added because of a suspected Cloudflare proxy issue. The standard OAuth flow only uses `GET` redirects (no `POST` to Supabase from the browser during sign-in), so Cloudflare proxying does not interfere. Email/password sign-in continues to work today through the same Cloudflare layer, confirming the proxy is fine for normal Supabase requests.

## Files touched

- `src/components/auth/SocialLoginOptions.tsx` — simplify to direct `signInWithOAuth` redirect
- `src/pages/AuthCallback.tsx` — remove relay / postMessage code paths
- `src/pages/OAuthPopup.tsx` — delete
- `src/App.tsx` — remove `/oauth-popup` route and import

## Verification after implementation

1. Open `https://fanrealms.com/login`, click **Continue with Google**, complete Google auth → should land on `/dashboard` signed in.
2. Repeat for Discord.
3. Confirm email/password login still works.
4. Check Supabase auth logs for a successful `/token?grant_type=pkce` exchange following the `/callback` 302.
