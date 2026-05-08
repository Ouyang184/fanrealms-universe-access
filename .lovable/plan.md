# Hardened Logout Flow

## Goal
When a user signs out, guarantee:
1. All in-memory profile/auth state is cleared synchronously.
2. No protected route content flashes during the sign-out transition.
3. Navigation to `/login` happens only after Supabase confirms `SIGNED_OUT` and storage is scrubbed.
4. Cached server data (React Query) tied to the user is dropped so the next user can't see stale data.

## Current State (already in place)
- `AuthContext.signOut` synchronously sets `signingOut=true`, clears `user/session/profile`, bumps the profile request token to drop in-flight fetches, and awaits the `SIGNED_OUT` event (4s timeout fallback).
- `useAuthFunctions.signOut` revokes session globally, falls back to local, scrubs `sb-*` / `supabase.auth.*` storage keys, and navigates to `/login`.
- `AuthGuard` renders a spinner while `signingOut` is true, preventing per-route flashes.

## Gaps to Close

### 1. Navigation timing
`useAuthFunctions.signOut` calls `navigate('/login')` itself, before `AuthContext.signOut` has awaited the `SIGNED_OUT` event. This means `/login` can mount while `signingOut` is still `true` and before the SDK has finished tearing down storage.

**Fix:** Remove the `navigate('/login')` from `useAuthFunctions.signOut`. Move it into `AuthContext.signOut`, dispatched only after `signedOutEvent` resolves and `setSigningOut(false)` runs.

### 2. Global flash protection
`AuthGuard` only protects routes wrapped with it. The marketplace, landing, and other public-but-personalized pages don't go through `AuthGuard`, so they could briefly re-render with cleared user state mid-logout.

**Fix:** In `AuthGate`, when `signingOut` is true, render the same loading spinner used for `blocked` state. This makes the global gate the single point of UI suppression during logout.

### 3. Query cache invalidation
React Query caches (profiles, subscriptions, posts, etc.) keyed by the previous user persist after sign-out and can leak into the next session if a different user signs in on the same tab.

**Fix:** In `AuthContext.signOut`, call `queryClient.clear()` after state is cleared and before awaiting the SIGNED_OUT event. Pull the `queryClient` via `useQueryClient()` inside the provider.

### 4. Defensive storage scrub timing
The storage purge currently runs inside `useAuthFunctions.signOut` after `signOut()` resolves. Keep it there — but also run it once more inside `AuthContext.signOut` after `signedOutEvent` resolves, to cover the timeout-fallback path where Supabase never emits `SIGNED_OUT`.

## Files to Change

- `src/contexts/AuthContext.tsx`
  - Import `useQueryClient` and `useNavigate`.
  - In `signOut`: after clearing state, call `queryClient.clear()`. After `signedOutEvent` resolves, run a final storage purge helper, set `signingOut=false`, then `navigate('/login', { replace: true })`.

- `src/hooks/useAuthFunctions.ts`
  - Remove the trailing `navigate('/login', { replace: true })` from `signOut` (AuthContext owns the redirect now).
  - Export the `purgeSupabaseStorage` helper (or extract it into `src/utils/auth-helpers.ts`) so AuthContext can reuse it.

- `src/components/AuthGate.tsx`
  - Read `signingOut` from `useAuth()`. Treat `signingOut` the same as `blocked` — render the loading spinner overlay so no route renders during logout.

- `src/utils/auth-helpers.ts` (or a new `src/utils/auth-storage.ts`)
  - Add a single `purgeSupabaseAuthStorage()` function used by both `useAuthFunctions.signOut` and `AuthContext.signOut`.

## Technical Notes
- Order in `AuthContext.signOut`: setSigningOut(true) → clear refs/state → bump profile token → `queryClient.clear()` → set up signedOutEvent waiter → `await rawSignOut()` → `await signedOutEvent` → `purgeSupabaseAuthStorage()` → `setSigningOut(false)` → `navigate('/login', { replace: true })`.
- Keep the 4s timeout fallback so a hung SDK never deadlocks the UI.
- `AuthGate`'s `signingOut` branch should short-circuit before its `decideTarget` call to avoid dispatching a competing redirect during the logout transition.
- No database/RLS changes; this is entirely client-side.

## Verification
- Sign in, click logout: confirm spinner shows, no flash of dashboard, lands on `/login`.
- Sign in, open React Query devtools, log out: cache should be empty.
- Throttle network, log out: 4s fallback still completes the redirect.
- Refresh `/dashboard` while signed out: AuthGate redirects to `/login` (existing behavior, regression check).
