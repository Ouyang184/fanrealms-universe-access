## Problem

When the user switches tabs and returns, Supabase fires `TOKEN_REFRESHED` (and sometimes `SIGNED_IN` / `INITIAL_SESSION`) on the existing session. `AuthContext.applySession` currently treats every event the same way: it bumps the request token, flips `profileLoading = true`, and re-fetches the profile from scratch. `AuthGate` blocks any sensitive route while `profileLoading` is true, so the user sees the full-screen "Verifying your session…" spinner every time they refocus the tab.

This is not how Gmail/Twitter/itch.io behave. The session check should be silent when the user hasn't actually changed.

## Fix

Make `applySession` a no-op for the profile fetch when the user id hasn't changed. The session/access token still updates (so future API calls use the fresh token), but we don't clear or re-fetch the profile, and `profileLoading` never flips to true.

### Changes

**`src/contexts/AuthContext.tsx`**
1. In `applySession`, compare the incoming `userId` to `userRef.current?.id`.
   - If both are non-null and equal → just update the session/user state (token rotation) and return. Do **not** bump `profileRequestRef`, do **not** set `profileLoading`, do **not** refetch the profile.
   - If the user id changed (sign-in, account switch, sign-out) → existing behavior (bump token, fetch profile, manage `profileLoading`).
2. The `INITIAL_SESSION` dedupe block already short-circuits the first duplicate; this new check covers `TOKEN_REFRESHED`, `SIGNED_IN` re-fires on tab focus, and `USER_UPDATED` for the same user.

No changes needed to `AuthGate` or `AuthGuard` — once `profileLoading` stops flipping on refocus, the spinner stops appearing.

### Out of scope

- The initial page-load spinner (when `authReady` is false) stays — that's the legitimate first session check.
- The cross-tab `SIGNED_OUT` flow stays — that's a real auth change.
- Sign-in / account-switch profile fetches stay — those are user-id changes.

## Technical detail

```ts
// Inside applySession, after computing userId:
const sameUser =
  userId !== null && userRef.current?.id === userId;

setSessionSafe(currentSession);
setUserSafe(currentSession?.user ?? null);

if (sameUser) {
  // Token rotation / silent refresh — keep existing profile, no spinner.
  return;
}

const requestId = ++profileRequestRef.current;
// …rest of existing fetch logic unchanged…
```
