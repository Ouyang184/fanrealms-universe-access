# Auth Session Redirect & Profile Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Logged-in users skip /login and /signup and are routed to /dashboard or /complete-profile based on whether their `creators.display_name` is set.

**Architecture:** Add `isProfileComplete` and `refreshProfile` to `AuthContext` (derived from `profile.display_name`), wire up the existing no-op `requireCompleteProfile` prop in `AuthGuard`, build a new `/complete-profile` page that upserts `username` + `display_name` into the `creators` table, and update `Login` + `Signup` to route based on profile completeness.

**Tech Stack:** React 18, React Router v6, Supabase JS v2, TypeScript, Tailwind CSS, shadcn/ui, Zod

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/types/auth.ts` | Modify | Add `display_name` to `Profile`; add `isProfileComplete` + `refreshProfile` to `AuthContextType` |
| `src/contexts/AuthContext.tsx` | Modify | Compute `isProfileComplete`, expose `refreshProfile` |
| `src/components/AuthGuard.tsx` | Modify | Redirect to `/complete-profile` when `requireCompleteProfile && !isProfileComplete` |
| `src/pages/CompleteProfile.tsx` | Create | Username + display name form; upserts `creators` row |
| `src/App.tsx` | Modify | Add `/complete-profile` route with `requireCompleteProfile={false}` |
| `src/pages/Login.tsx` | Modify | Route to `/complete-profile` when profile incomplete |
| `src/pages/Signup.tsx` | Modify | Same as Login |

---

## Task 1: Extend types and AuthContext

**Files:**
- Modify: `src/lib/types/auth.ts`
- Modify: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: Add `display_name` to `Profile` and new members to `AuthContextType`**

Open `src/lib/types/auth.ts`. Replace the `Profile` interface and `AuthContextType` with:

```ts
export interface Profile {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  bio?: string;
  profile_picture?: string;
  display_name?: string | null;   // ← new
  creator_id?: string | null;     // ← new
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isProfileComplete: boolean;                          // ← new
  refreshProfile: () => Promise<void>;                 // ← new
  signIn: (email: string, password: string, captchaToken?: string) => Promise<AuthResult>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signUp: (email: string, password: string, captchaToken?: string, fullName?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<Profile | null>;
}
```

- [ ] **Step 2: Add `isProfileComplete` and `refreshProfile` to `AuthContext.tsx`**

Open `src/contexts/AuthContext.tsx`. Replace the `value` block and add `refreshProfile`:

```tsx
  const refreshProfile = async () => {
    if (!user) return;
    const requestId = ++profileRequestRef.current;
    const userProfile = await fetchUserProfile(user.id);
    if (requestId !== profileRequestRef.current) return; // discard stale
    setProfile(userProfile as Profile | null);
  };

  const isProfileComplete = !!(profile?.display_name?.trim());

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    isProfileComplete,
    refreshProfile,
    signIn,
    signInWithMagicLink,
    signUp,
    signOut,
    updateProfile: handleUpdateProfile
  };
```

- [ ] **Step 3: Verify the build compiles**

```bash
cd "C:\Users\jakey\Claude Code\fanrealms-universe-access"
npm run build 2>&1 | tail -5
```

Expected: `✓ built in` with no TypeScript errors. Fix any type errors before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types/auth.ts src/contexts/AuthContext.tsx
git commit -m "feat(auth): add isProfileComplete and refreshProfile to AuthContext"
```

---

## Task 2: Wire AuthGuard profile check

**Files:**
- Modify: `src/components/AuthGuard.tsx`

- [ ] **Step 1: Add the profile-complete redirect to the `run` function**

Open `src/components/AuthGuard.tsx`. Replace the entire `run` async function inside the `useEffect` with:

```ts
    const run = async () => {
      // Authenticated user landing on an auth page → skip to dashboard or complete-profile.
      if (user && isAuthPath(location.pathname)) {
        if (location.pathname !== '/dashboard') {
          safeNavigate('/dashboard');
        } else {
          setHasCheckedAuth(true);
        }
        return;
      }

      // No user in context — double-check storage before bouncing to /login.
      if (requireAuth && !user) {
        if (isAuthPath(location.pathname)) {
          setHasCheckedAuth(true);
          return;
        }

        setSessionRestorePending(true);
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;
        setSessionRestorePending(false);

        if (error || !data.session?.user) {
          const loginUrl = buildLoginUrl(location.pathname, location.search);
          safeNavigate(loginUrl);
          return;
        }
        setHasCheckedAuth(true);
        return;
      }

      // Authenticated user with incomplete profile → redirect to /complete-profile.
      // Only runs when requireCompleteProfile is true and we are NOT already there.
      if (
        requireCompleteProfile &&
        user &&
        !isProfileComplete &&
        location.pathname !== '/complete-profile'
      ) {
        const returnTo = encodeURIComponent(location.pathname + location.search);
        safeNavigate(`/complete-profile?returnTo=${returnTo}`);
        return;
      }

      setHasCheckedAuth(true);
    };
```

- [ ] **Step 2: Pull `isProfileComplete` from `useAuth()`**

At the top of the `AuthGuard` component, update the destructure:

```ts
  const { user, profile, loading, isProfileComplete } = useAuth();
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in` — no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/AuthGuard.tsx
git commit -m "feat(auth): wire requireCompleteProfile in AuthGuard — redirect incomplete profiles"
```

---

## Task 3: Build the CompleteProfile page

**Files:**
- Create: `src/pages/CompleteProfile.tsx`

- [ ] **Step 1: Create the page file**

Create `src/pages/CompleteProfile.tsx` with the full implementation:

```tsx
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeReturnTo } from '@/utils/auth-redirects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';

const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;

export default function CompleteProfile() {
  const { user, loading, isProfileComplete, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; displayName?: string }>({});

  // If profile is already complete, skip to destination
  useEffect(() => {
    if (!loading && isProfileComplete) {
      const params = new URLSearchParams(location.search);
      const returnTo = sanitizeReturnTo(params.get('returnTo'), '/dashboard');
      navigate(returnTo, { replace: true });
    }
  }, [loading, isProfileComplete, navigate, location.search]);

  const validate = (): boolean => {
    const errors: { username?: string; displayName?: string } = {};
    if (!USERNAME_RE.test(username)) {
      errors.username =
        'Username must be 3–30 characters and contain only lowercase letters, numbers, underscores, or hyphens.';
    }
    if (!displayName.trim() || displayName.trim().length > 60) {
      errors.displayName = 'Display name must be between 1 and 60 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);

    try {
      const cleanUsername = username.trim().toLowerCase();
      const cleanDisplayName = displayName.trim();

      // Check username uniqueness (exclude the current user's own row)
      const { data: existing } = await supabase
        .from('creators')
        .select('id')
        .eq('username', cleanUsername)
        .neq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        setFieldErrors({ username: 'That username is already taken. Please choose another.' });
        return;
      }

      // Upsert the creators row with username + display_name
      const { error: upsertError } = await supabase
        .from('creators')
        .upsert(
          { user_id: user!.id, username: cleanUsername, display_name: cleanDisplayName },
          { onConflict: 'user_id' }
        );

      if (upsertError) throw upsertError;

      // Also keep users.username in sync
      await supabase
        .from('users')
        .update({ username: cleanUsername })
        .eq('id', user!.id);

      // Refresh profile in AuthContext so isProfileComplete becomes true
      await refreshProfile();

      // Navigate to intended destination
      const params = new URLSearchParams(location.search);
      const returnTo = sanitizeReturnTo(params.get('returnTo'), '/dashboard');
      navigate(returnTo, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-xl font-bold">FanRealms</Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Set up your profile</CardTitle>
            <CardDescription className="text-center">
              Choose a username and display name to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-sm text-destructive text-center bg-destructive/10 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <div className="space-y-1">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    fanrealms.com/
                  </span>
                  <Input
                    id="username"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value.toLowerCase());
                      setFieldErrors(prev => ({ ...prev, username: undefined }));
                    }}
                    placeholder="yourname"
                    className="pl-[120px]"
                    autoComplete="username"
                    maxLength={30}
                    disabled={submitting}
                  />
                </div>
                {fieldErrors.username && (
                  <p className="text-xs text-destructive">{fieldErrors.username}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  3–30 chars · lowercase letters, numbers, _ and - only
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="displayName" className="text-sm font-medium">
                  Display name
                </label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={e => {
                    setDisplayName(e.target.value);
                    setFieldErrors(prev => ({ ...prev, displayName: undefined }));
                  }}
                  placeholder="e.g. Jake's Studio"
                  maxLength={60}
                  disabled={submitting}
                />
                {fieldErrors.displayName && (
                  <p className="text-xs text-destructive">{fieldErrors.displayName}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Shown publicly on your profile and listings
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Saving…' : 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in` — no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CompleteProfile.tsx
git commit -m "feat(auth): add CompleteProfile page with username and display name form"
```

---

## Task 4: Register route and update Login + Signup

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Login.tsx`
- Modify: `src/pages/Signup.tsx`

- [ ] **Step 1: Add the import and route to `App.tsx`**

In `src/App.tsx`, add the import with the other page imports:

```tsx
import CompleteProfile from "./pages/CompleteProfile";
```

Add the route inside `<Routes>`, in the Auth section (after `/reset-password`, before `/auth/callback`):

```tsx
<Route
  path="/complete-profile"
  element={
    <AuthGuard requireCompleteProfile={false}>
      <CompleteProfile />
    </AuthGuard>
  }
/>
```

- [ ] **Step 2: Update `Login.tsx` redirect logic**

In `src/pages/Login.tsx`, replace the `useAuth` destructure and the redirect `useEffect`:

```tsx
  const { user, loading, isProfileComplete } = useAuth();
```

Replace the redirect effect (the one that calls `navigate`) with:

```tsx
  useEffect(() => {
    if (loading || !user) return;

    if (!isProfileComplete) {
      const params = new URLSearchParams(location.search);
      const returnTo = params.get('returnTo') ?? '/dashboard';
      navigate(
        `/complete-profile?returnTo=${encodeURIComponent(sanitizeReturnTo(returnTo, '/dashboard'))}`,
        { replace: true }
      );
      return;
    }

    const params = new URLSearchParams(location.search);
    const returnTo = sanitizeReturnTo(params.get('returnTo'), '/dashboard');
    navigate(returnTo, { replace: true });
  }, [loading, user, isProfileComplete, location.search, navigate]);
```

- [ ] **Step 3: Update `Signup.tsx` redirect logic**

Open `src/pages/Signup.tsx`. Find the `useAuthCheck` call or any existing auth-check / redirect logic for already-logged-in users. Replace it with:

```tsx
  const { user, loading: authLoading, isProfileComplete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Skip page if already logged in
  useEffect(() => {
    if (authLoading || !user) return;

    if (!isProfileComplete) {
      navigate('/complete-profile', { replace: true });
      return;
    }
    navigate('/dashboard', { replace: true });
  }, [authLoading, user, isProfileComplete, navigate]);
```

If `Signup.tsx` already imports `useAuth`, `useNavigate`, `useLocation` — don't add duplicate imports. Remove the `useAuthCheck` import and call if present.

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in` — no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/pages/Login.tsx src/pages/Signup.tsx
git commit -m "feat(auth): route logged-in users to /complete-profile or /dashboard on login/signup"
```

---

## Task 5: Push to main

- [ ] **Step 1: Pull and push**

```bash
git pull --rebase origin main && git push origin main
```

Expected: `main -> main` success line.

---

## Manual Smoke Tests

After deploying, verify these flows in a browser:

| Scenario | Expected result |
|---|---|
| New email signup | After email confirmation → lands on `/complete-profile` |
| New OAuth (Google/Discord) signup | After OAuth callback → lands on `/complete-profile` |
| Complete profile form — taken username | Inline error "already taken", no navigation |
| Complete profile form — invalid username (spaces, uppercase) | Inline field error, no submission |
| Complete profile form — valid submission | → `/dashboard` |
| Logged-in user with complete profile visits `/login` | → `/dashboard` |
| Logged-in user with complete profile visits `/signup` | → `/dashboard` |
| Logged-in user with complete profile visits `/complete-profile` directly | → `/dashboard` |
| Logged-in user with incomplete profile visits `/dashboard` | → `/complete-profile?returnTo=/dashboard` |
| After completing profile from `/dashboard` redirect | → `/dashboard` |
