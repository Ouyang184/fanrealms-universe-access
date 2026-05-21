# Plan: One-Shot Auth Redirect Safeguards

Goal: prevent the auth-check effect from firing repeated navigations, repeated `purgeSupabaseAuthStorage` calls, or repeated login redirects within a single navigation/auth transition.

## Scope

Two files own this behavior:
- `src/components/AuthGate.tsx` — global gate + redirect dispatcher
- `src/lib/hooks/useAuthCheck.ts` — per-page auth check (used by `Settings`, `AccountSettings`)

No other files change. No business logic, no auth flow changes.

## Changes

### 1. `src/components/AuthGate.tsx`
Today `transitionKeyRef` tracks `user.id | complete | pathname+search`, but the effect can still re-enter on the same key if React re-runs it after a fast state change, and the post-render `decideTarget()` call runs every render with no guard.

Add:
- A `lastDispatchedTargetRef` that stores the last `target` we navigated to. If the effect computes the same target for the same key, no-op.
- A hard cap `MAX_REDIRECTS_PER_KEY = 1` per transition key, with a counter ref `dispatchCountRef` reset whenever the key changes. Second attempt within the same key logs once and bails.
- Move the "flash prevention" `decideTarget` call into a `useMemo` keyed on the same inputs so it only recomputes when inputs change, and gate the loading splash on `pendingTarget !== null && pendingTarget !== current && !alreadyDispatched`.
- Guard the `/signup` sign-out effect with the existing `signedOutForSignupRef` plus an additional check that `signingOut` is false AND we haven't already initiated — preventing a second `signOut()` if React re-runs the effect before `signingOut` flips.

### 2. `src/lib/hooks/useAuthCheck.ts`
Today it has `lastNavRef` + `MAX_REDIRECTS = 3`, but it resets only on unmount and can still dispatch on every render until `isChecking` clears.

Add:
- A composite `transitionKey` = `${user?.id ?? 'anon'}|${requireAuth}|${location.pathname}${location.search}`.
- A `dispatchedKeyRef`: once we navigate for a key, mark it and skip until the key changes.
- Reset `redirectCountRef` when the key changes (currently it only grows for the component's lifetime, which can wedge legitimate later redirects).
- Remove the unused `cancelled` variable.

### 3. No new tests required
Existing Playwright specs cover the loop cases:
- `e2e/auth-redirect-when-logged-in.spec.ts`
- `e2e/incomplete-profile-loop.spec.ts`
- `e2e/session-restore-on-reload.spec.ts`

They should continue to pass; if any regress, fix forward.

## Out of scope
- AuthContext, useAuthFunctions, edge functions, RLS — untouched.
- No visual / UX changes (spinner copy stays the same).
