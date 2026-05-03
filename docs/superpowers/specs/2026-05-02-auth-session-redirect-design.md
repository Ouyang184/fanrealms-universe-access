# Auth Session Redirect & Profile Completion Design

**Date:** 2026-05-02  
**Status:** Approved

---

## Goal

Logged-in users skip `/login` and `/signup` and are routed to `/dashboard` or `/complete-profile` based on whether their profile is complete. Every new user (email or OAuth) must pick a username and display name before accessing the dashboard — matching itch.io's pattern.

---

## "Profile Complete" Definition

A user's profile is **complete** when their `creators` row has a non-empty `display_name`.

- `display_name IS NULL` → incomplete (new user, hasn't gone through setup)
- `display_name` set to a non-empty string → complete

No schema change required. `display_name` is already nullable in the `creators` table.

---

## Architecture

### 1. `isProfileComplete` in AuthContext (`src/contexts/AuthContext.tsx`)

Add a derived boolean to the context value:

```ts
isProfileComplete: boolean
// computed as: !!(profile?.display_name?.trim())
```

`profile` is already fetched by `AuthContext` via the `useProfile` hook. This is a zero-cost derivation — no extra queries.

Consumers: `AuthGuard`, `Login`, `Signup`.

---

### 2. `/complete-profile` Page (new: `src/pages/CompleteProfile.tsx`)

A focused form page shown to new users before they can access the dashboard.

**Fields collected:**

| Field | Rules |
|---|---|
| Username | 3–30 chars, lowercase alphanumeric + underscores/hyphens only (`^[a-z0-9_-]{3,30}$`). Must be unique (checked against `creators` table). Shown in profile URL: `fanrealms.com/username`. |
| Display name | 1–60 chars, any characters. Shown publicly as the creator's name. |

**Behaviour:**
- Accessible to authenticated users only (route wrapped in auth-only guard, see below).
- If user is already profile-complete and visits `/complete-profile` directly → redirect to `/dashboard`.
- On submit: update the user's `creators` row (`username`, `display_name`). Show inline error if username is taken.
- On success: navigate to `?returnTo` param if present and safe (via `sanitizeReturnTo`), otherwise `/dashboard`.

**Username uniqueness check:**
Query `creators` table for any row with the given username (excluding the current user's own row) before submitting. Show an inline error immediately, not after a round-trip.

---

### 3. AuthGuard Updates (`src/components/AuthGuard.tsx`)

The `requireCompleteProfile` prop already exists but is a no-op. Wire it up:

- **Default:** `requireCompleteProfile = true` (keeps existing prop signature, no call-site changes needed).
- **Logic added:** After confirming the user is authenticated, if `requireCompleteProfile && !isProfileComplete` → redirect to `/complete-profile`.
- Redirect carries `?returnTo=<current path>` so after profile completion the user lands where they intended.
- Loop prevention: `/complete-profile` itself is **not** wrapped with `requireCompleteProfile`, so there is no redirect loop.

---

### 4. Route in `App.tsx`

```tsx
// Auth-only, no profile-complete requirement
<Route
  path="/complete-profile"
  element={
    <AuthGuard requireCompleteProfile={false}>
      <CompleteProfile />
    </AuthGuard>
  }
/>
```

Place this in the auth section, before the `/:username` catch-all.

---

### 5. Login + Signup Skip Logic

**`Login.tsx`** already redirects to `returnTo` once `user` is set. Update to also check `isProfileComplete`:

```
user set in context
  └─ isProfileComplete? → navigate(returnTo || '/dashboard')
  └─ !isProfileComplete? → navigate('/complete-profile')
```

**`Signup.tsx`** uses `useAuthCheck(false, "/dashboard")` to skip if logged in. Replace with inline effect using `useAuth()` that mirrors the Login logic above.

---

## Data Flow

```
New signup (email or OAuth)
  auth.users row created → DB trigger creates creators row (username auto-set, display_name NULL)
  User navigates to /dashboard
    AuthGuard: authenticated ✓, isProfileComplete ✗
    → redirect to /complete-profile
  User fills username + display_name, submits
    creators row updated (username, display_name)
    AuthContext re-fetches profile → isProfileComplete becomes true
    → navigate to /dashboard

Already logged-in user visits /login or /signup
  AuthContext: user is set
  isProfileComplete?
    true  → navigate to /dashboard
    false → navigate to /complete-profile
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Username already taken | Inline error below the username field, no form submission |
| Supabase update fails | Toast error, form re-enabled |
| User has no `creators` row (edge case) | Treat as incomplete → show complete-profile form; upsert row on submit |
| Auth loading state | Show spinner, don't redirect until `loading === false` |

---

## Files Changed

| File | Change |
|---|---|
| `src/contexts/AuthContext.tsx` | Add `isProfileComplete` to context value |
| `src/components/AuthGuard.tsx` | Wire up `requireCompleteProfile` — redirect to `/complete-profile` when incomplete |
| `src/pages/CompleteProfile.tsx` | **New.** Username + display name form |
| `src/pages/Login.tsx` | Route to `/complete-profile` instead of `/dashboard` when profile incomplete |
| `src/pages/Signup.tsx` | Same as Login |
| `src/App.tsx` | Add `/complete-profile` route with `requireCompleteProfile={false}` |

---

## Out of Scope

- Editing username/display name after initial setup (that's Account Settings — already exists)
- Avatar upload on the complete-profile page (can be done in settings later)
- Terms of service acceptance gate (separate feature)
