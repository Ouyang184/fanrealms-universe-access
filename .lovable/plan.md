## Goal

Right now any signed-up user has a `public.users` row but no `creators` row. Without that row they can't access the creator dashboard sections (Projects, Assets, Sales), can't upload anything, and don't appear in Featured Creators. The current "Become a Creator" button on `CreatorCheck` sends people to `/complete-profile`, which no longer creates a `creators` row — so the upgrade path is broken.

This plan adds a real opt-in flow that turns a regular user into a creator.

## What changes for the user

1. A new **Become a Creator** page at `/become-creator` with a short form (display name prefilled, optional bio, optional tags, NSFW toggle).
2. Submitting the form creates a `creators` row linked to their `user_id`, using their existing `username` / `display_name` from `public.users`.
3. Once they're a creator:
   - The dashboard sidebar's **CREATE** section appears (Projects, Upload, Assets, Sales).
   - They can upload projects and list assets.
   - They become eligible to show up in **Featured Creators** (the existing `get_public_creators_list` RPC already returns any row in `creators`, sorted by followers — no DB change needed).
4. The dashboard overview gains a **"Become a Creator"** call-to-action card for users who don't have a creator row yet, instead of silently hiding the creator features.

## Where it plugs in

- `CreatorCheck` (used by `/dashboard/projects`, `/dashboard/projects/new`, and other creator-only pages) currently shows a "Become a Creator" button that points at `/complete-profile`. Repoint it to `/become-creator`.
- `DashboardLayout` already conditionally renders the **CREATE** sidebar section based on `useCreatorProfile().isCreator`. No change needed there — it will light up automatically once the row exists.
- `Dashboard` overview page gets a new top banner / card shown only when `isCreator === false`, linking to `/become-creator`.
- `TopNav` Upload button: keep as-is (it routes into the dashboard, where `CreatorCheck` will prompt non-creators to upgrade).

## Technical details

### New page: `src/pages/BecomeCreator.tsx`
- Wrapped in `AuthGuard` (must be signed in + profile complete).
- If `useCreatorProfile().isCreator` is true, redirect to `/dashboard`.
- Form fields:
  - `display_name` (prefilled from `users.display_name`, editable)
  - `bio` (textarea, optional, max 500 chars)
  - `tags` (comma-separated, optional)
  - `is_nsfw` (checkbox, default false)
- On submit:
  - Read `username` from `public.users` for the current user.
  - `INSERT INTO creators (user_id, username, display_name, bio, tags, is_nsfw)` — RLS already allows this via the existing "Creators can manage their own full profile data" policy (`auth.uid() = user_id`).
  - Invalidate `['creator-profile', user.id]` and `['userCreator', user.id]` queries so the dashboard reacts immediately.
  - Navigate to `/dashboard`.

### Updated files
- `src/components/creator-studio/CreatorCheck.tsx`: change `navigate('/complete-profile')` → `navigate('/become-creator')`. Update copy to "Set up your creator profile to upload projects, list assets, and earn from your work."
- `src/pages/Dashboard.tsx`: add a non-creator CTA card at the top (only when `!isCreator`) with a "Become a Creator" button → `/become-creator`.
- `src/App.tsx`: add `<Route path="/become-creator" element={<AuthGuard><BecomeCreator /></AuthGuard>} />`.

### Featured Creators
No code or DB change required. The existing RPC `get_public_creators_list` returns every `creators` row sorted by `follower_count`. New creators will naturally appear (at the bottom until they get followers). If you also want a "Recently joined" rail on the homepage, that would be a follow-up — out of scope for this plan.

### What this plan deliberately does NOT do
- Does **not** change `/complete-profile` (still username + display_name for everyone).
- Does **not** add admin curation / approval — anyone can self-upgrade, matching itch.io.
- Does **not** add Stripe Connect onboarding here. That stays a separate later step triggered the first time a creator tries to publish a paid asset.

## Files touched

- `src/pages/BecomeCreator.tsx` (new)
- `src/components/creator-studio/CreatorCheck.tsx` (redirect target + copy)
- `src/pages/Dashboard.tsx` (non-creator CTA)
- `src/App.tsx` (route)
