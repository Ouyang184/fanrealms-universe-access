## Goal

After /complete-profile submits, verify completion against Supabase (not React state) and only navigate to /dashboard (or `returnTo`) once the persisted record actually passes validation. If it doesn't, surface an inline error and stay on the page instead of silently bouncing.

## Changes

**`src/pages/CompleteProfile.tsx` — `handleSubmit`**
1. After the upsert + `users.username` sync, call `fetchProfileCompletion(user.id)` directly (the Supabase-direct helper already in `src/lib/auth/profileCompletion.ts`).
2. If it returns `false`, set a form-level error ("We couldn't verify your profile, please try again.") and stop — do NOT navigate. This prevents the historical bounce-back-to-/complete-profile loop and tells the user something concrete.
3. If `true`:
   - Call `refreshProfile()` so AuthContext state catches up with the persisted truth (keeps `isProfileComplete` consistent for any consumer that mounts on /dashboard).
   - Compute target with `resolveCompletionRoute(true, sanitizeReturnTo(params.get('returnTo'), '/dashboard'))`.
   - `navigate(target, { replace: true })`.
4. Drop the existing `resolvePostAuthRoute` call here — we want the explicit fetch + refresh sequence so the post-submit path is auditable and never returns `/complete-profile` as a target.

**No changes** to AuthContext, AuthGuard, or the helpers — they already expose everything we need (`fetchProfileCompletion`, `refreshProfile`, `resolveCompletionRoute`).

## Why this shape

- `fetchProfileCompletion` reads the freshly-written row directly, so we trust the database, not React state that may not have re-rendered yet.
- Calling `refreshProfile()` after success keeps `AuthContext.profile` and `isProfileComplete` in sync so AuthGuard on /dashboard doesn't immediately re-evaluate against stale data and bounce back.
- Refusing to navigate on `false` (instead of routing to `/complete-profile?returnTo=...`) eliminates the only remaining path where a user could be stuck in a redirect loop after submitting valid-looking input.
