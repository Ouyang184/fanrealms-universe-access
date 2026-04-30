
# Fix Google sign-in / sign-up

## Diagnosis

From the Supabase auth logs and the codebase, three real blockers were identified:

1. **Conflicting Google client in `src/main.tsx`**
   The app wraps the entire React tree in `<GoogleOAuthProvider>` from `@react-oauth/google` with a hardcoded Google client ID. The actual sign-in goes through **Supabase OAuth** (`supabase.auth.signInWithOAuth`). Running both Google Identity Services *and* Supabase OAuth on the same page can hijack the popup/redirect and corrupt the PKCE flow. The session replay confirms `Google Identity Services client library` is being injected on page load even though no GIS button is rendered.

2. **`/auth/callback` is not a public route in `AuthGuard` terms, but the redirect race still hurts it**
   `AuthCallback` calls `exchangeCodeForSession`, but `AuthContext` runs its own `getSession()` on mount. If `AuthContext` resolves first with no session, any guarded page the user lands on right after redirect (`/dashboard`) bounces to `/login?returnTo=…` before the freshly-exchanged session is committed. The Supabase logs show repeated `/authorize → /callback` cycles consistent with this loop.

3. **PKCE verifier may not be present on `/auth/callback` after the redirect from Google**
   When the user starts OAuth on `https://www.fanrealms.com` but Supabase returns to `https://fanrealms.com/auth/callback` (or vice-versa), the PKCE `code-verifier` stored in `localStorage` is on a different origin and `exchangeCodeForSession` fails silently. Today we don't surface this clearly and we don't ensure a single canonical origin.

## What we'll change

### 1. Remove the conflicting Google provider
- In `src/main.tsx`, delete the `<GoogleOAuthProvider>` wrapper and its `@react-oauth/google` import. Render `<App />` directly inside `React.StrictMode`.
- Remove the `@react-oauth/google` dependency from `package.json`.

### 2. Patch the callback flow (`src/pages/AuthCallback.tsx`)
- Stop relying on `useAuth()` to drive navigation. Inside the callback, after `exchangeCodeForSession` succeeds, navigate to `returnTo` directly using `window.location.replace(returnTo)`. This guarantees the next page boots with the new session already in `localStorage` and avoids the AuthContext race.
- If no `code` is present and `getSession()` returns nothing, redirect to `/login` with a clear toast instead of waiting 5s.
- Keep the existing recovery + provider error branches.

### 3. Make `AuthGuard` wait one tick after a fresh login
- In `src/components/AuthGuard.tsx`, when `loading === false` and `user === null`, call `supabase.auth.getSession()` once before bouncing to `/login`. If a session exists in storage, set `user` via the next `onAuthStateChange` and stop the redirect. This closes the post-callback race window without changing existing protected-page behavior.

### 4. Normalize the OAuth origin (`src/components/auth/SocialLoginOptions.tsx`)
- Compute `redirectTo` from a single canonical host: if `window.location.hostname === 'www.fanrealms.com'`, use `https://fanrealms.com/auth/callback?...`; otherwise keep `window.location.origin`. This ensures the PKCE verifier written before redirect is read on the same origin after redirect.
- Remove the `recordOAuthDebug` calls and the `/auth/debug` page (no longer needed once the flow works). Drop the route from `src/App.tsx` and delete `src/pages/AuthDebug.tsx`.

### 5. Verify
- After changes, open `/login` in the preview, click "Continue with Google", complete Google's consent, and confirm we land on `/dashboard` with a session. Capture console logs and the Supabase auth logs to confirm the `/callback → /authorize` loop is gone.

## Required Supabase dashboard settings (cannot be set from code)

For the fix to take effect on the live site, in **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL**: `https://fanrealms.com`
- **Additional Redirect URLs** must include all of:
  - `https://fanrealms.com/auth/callback`
  - `https://www.fanrealms.com/auth/callback`
  - `https://fanrealms-universe-access.lovable.app/auth/callback`
  - `https://id-preview--77a75b15-d40c-4de1-9a69-95e5c12211ff.lovable.app/auth/callback`
  - `https://77a75b15-d40c-4de1-9a69-95e5c12211ff.lovableproject.com/auth/callback`

And in the **Google Cloud Console** OAuth client → Authorized redirect URIs, keep only Supabase's:
`https://eaeqyctjljbtcatlohky.supabase.co/auth/v1/callback`

## Files touched

- `src/main.tsx` — remove GoogleOAuthProvider
- `package.json` — drop `@react-oauth/google`
- `src/pages/AuthCallback.tsx` — patch exchange + navigation
- `src/components/AuthGuard.tsx` — re-check session before bouncing
- `src/components/auth/SocialLoginOptions.tsx` — canonical redirect host, remove debug recorder
- `src/App.tsx` — remove `/auth/debug` route + import
- `src/pages/AuthDebug.tsx` — delete
