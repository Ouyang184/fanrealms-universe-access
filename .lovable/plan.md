## Goal

Stop forcing every signed-up user through a "creator" profile step. A profile is "complete" once the user has a `username` + `display_name` on `public.users`. The `creators` row is created later, only when the user opts in to becoming a creator.

## Changes

### 1. Database (migration)
- `public.users`: add `display_name text` (nullable) if not present. `username` already exists.
- Add a partial unique index on `lower(username)` in `public.users` (case-insensitive uniqueness).
- Backfill: for users that already have a `creators` row, copy `creators.username` / `creators.display_name` into `public.users` where `users.username` is null. This keeps existing creators "complete" without re-onboarding.
- No changes to RLS for `users` (assumed already user-scoped).

### 2. `src/lib/auth/profileCompletion.ts`
- Change `fetchProfileCompletion(userId)` to read `username, display_name` from `public.users` instead of `creators`.
- Keep the same strict validators (`USERNAME_RE`, display-name length).
- `isProfileComplete` shape stays the same — still requires both fields.

### 3. `src/pages/CompleteProfile.tsx`
- On submit:
  - Check username uniqueness against `public.users` (not `creators`), excluding current user.
  - `update public.users set username, display_name where id = user.id` (the row already exists via the `on_auth_user_created` trigger — never insert from client per project rule).
  - Remove the `creators` upsert entirely. Becoming a creator is a separate, later flow.
- Re-verify with `fetchProfileCompletion`, `refreshProfile`, then redirect to `returnTo` / `/dashboard` (unchanged).

### 4. `AuthContext` profile shape
- Ensure `refreshProfile` / the `Profile` type loads `username` and `display_name` from `public.users` so `isProfileComplete(profile)` works off the cached profile without an extra fetch. If it currently reads from `creators`, switch the source to `users`.

### 5. Become-a-creator path (out of scope for this change, but noted)
- The existing creator-only screens (commission setup, creator dashboard, etc.) will need a "Become a creator" entry that inserts the `creators` row on demand. Not part of this plan — flagged so we don't accidentally re-introduce the forced creator step elsewhere.

## Why this is safe

- Existing creators get backfilled into `public.users`, so they won't be bounced to `/complete-profile`.
- Non-creators only need a username + display name on `users` — no `creators` row required to use the marketplace, job board, or forum.
- Auth gate logic (`AuthGate`, `AuthGuard`, `resolveCompletionRoute`) doesn't change — it already routes purely off `isProfileComplete`.

## Memory updates after implementation

- Update core memory: "Profile completeness = username + display_name on `public.users`. `creators` row is creator-opt-in, not a signup requirement."
