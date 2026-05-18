
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/lib/types/auth';
import { useAuthFunctions } from '@/hooks/useAuthFunctions';
import { useProfile } from '@/hooks/useProfile';
import { purgeSupabaseAuthStorage } from '@/utils/auth-storage';
import { toast } from 'sonner';
import type { AuthContextType } from '@/lib/types/auth';
import {
  isProfileComplete as isComplete,
  fetchProfileCompletion,
  resolveCompletionRoute,
} from '@/lib/auth/profileCompletion';

// Singleton across HMR reloads. Without this, hot-reloading this file creates
// a new context object while existing consumers (rendered by parents that
// didn't reload) still reference the previous one, causing useContext to
// return undefined and throwing "useAuth must be used within an AuthProvider".
const AUTH_CONTEXT_SINGLETON_KEY = '__fanrealms_auth_context__';
type GlobalWithAuthContext = typeof globalThis & {
  [AUTH_CONTEXT_SINGLETON_KEY]?: React.Context<AuthContextType | undefined>;
};
const globalRef = globalThis as GlobalWithAuthContext;
const AuthContext: React.Context<AuthContextType | undefined> =
  globalRef[AUTH_CONTEXT_SINGLETON_KEY] ??
  (globalRef[AUTH_CONTEXT_SINGLETON_KEY] = createContext<AuthContextType | undefined>(undefined));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  // `authReady` only flips true after BOTH the initial getSession() has
  // resolved AND the first onAuthStateChange event has fired. AuthGate
  // uses this to block sensitive routes (/login, /signup, /dashboard,
  // /complete-profile) from rendering with an indeterminate auth state.
  const [authReady, setAuthReady] = useState(false);
  const gotInitialSessionRef = useRef(false);
  const gotInitialEventRef = useRef(false);
  const [signingOut, setSigningOut] = useState(false);

  // Refs that always mirror the latest committed state. Async functions
  // (refreshProfile, resolvePostAuthRoute, handleUpdateProfile) read from
  // these instead of from closure-captured state so they never act on
  // stale values when auth or profile changes during their execution.
  const userRef = useRef<User | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const profileRef = useRef<Profile | null>(null);

  // Monotonic token used to discard stale async results. Every operation
  // that mutates auth/profile state (session change, refresh, update,
  // sign-out) bumps this; any fetch whose token doesn't match the current
  // value when it resolves is discarded.
  const profileRequestRef = useRef(0);

  const setSessionSafe = (s: Session | null) => {
    sessionRef.current = s;
    setSession(s);
  };
  const setUserSafe = (u: User | null) => {
    userRef.current = u;
    setUser(u);
  };
  const setProfileSafe = (p: Profile | null) => {
    profileRef.current = p;
    setProfile(p);
  };

  const { fetchUserProfile, updateProfile: updateUserProfile } = useProfile();
  const { signIn, signInWithMagicLink, signUp, signOut: rawSignOut } = useAuthFunctions();

  // Resolver wired to the next SIGNED_OUT event from Supabase. Set by
  // signOut() before kicking off the async work; cleared by the
  // onAuthStateChange listener (or the timeout fallback) so signingOut
  // only flips back to false once the SDK has fully torn down the session.
  const signedOutResolverRef = useRef<(() => void) | null>(null);

  // Wrap signOut so we can set a `signingOut` flag *synchronously* before the
  // async work begins. AuthGuard reads this flag and hides protected UI
  // immediately, so users never see authed content flash on the way to /login.
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  const queryClient = useQueryClient();

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const signOut = React.useCallback(async () => {
    setSigningOut(true);
    profileRequestRef.current += 1;
    setUserSafe(null);
    setSessionSafe(null);
    setProfileSafe(null);

    // Drop all cached server data tied to the previous user.
    try {
      queryClient.clear();
    } catch {
      /* ignore */
    }

    const signedOutEvent = new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        signedOutResolverRef.current = null;
        window.clearTimeout(timer);
        resolve();
      };
      const timer = window.setTimeout(finish, 4000);
      signedOutResolverRef.current = finish;
    });

    try {
      await rawSignOut();
    } finally {
      await signedOutEvent;
      // Final defensive scrub for the timeout-fallback path.
      purgeSupabaseAuthStorage();
      setSigningOut(false);
      navigateRef.current('/login', { replace: true });
    }
  }, [rawSignOut, queryClient]);

  useEffect(() => {
    let cancelled = false;



    const applySession = (currentSession: Session | null, source: string) => {
      if (cancelled) return;

      const userId = currentSession?.user?.id ?? null;
      const sameUser = userId !== null && userRef.current?.id === userId;

      setSessionSafe(currentSession);
      setUserSafe(currentSession?.user ?? null);

      // Silent token rotation / tab refocus for the same user — keep the
      // existing profile and don't trigger a loading state. Without this,
      // every TOKEN_REFRESHED event would flash the AuthGate spinner.
      if (sameUser) return;

      const requestId = ++profileRequestRef.current;

      if (userId) {
        setProfileLoading(true);
        // Defer to next tick so React commits the user/session change first.
        setTimeout(() => {
          fetchUserProfile(userId).then(userProfile => {
            if (cancelled) return;
            // Discard if a newer auth/profile op has started OR the user
            // id has changed mid-flight (e.g. fast user switch).
            if (requestId !== profileRequestRef.current) return;
            if (userRef.current?.id !== userId) return;
            setProfileSafe(userProfile);
            setProfileLoading(false);
          }).catch(() => {
            if (cancelled) return;
            if (requestId !== profileRequestRef.current) return;
            setProfileLoading(false);
          });
        }, 0);
      } else {
        setProfileLoading(false);
        setProfileSafe(null);
      }
    };

    // Set up listener before getSession so session restoration events cannot be missed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {

        // INITIAL_SESSION fires right after getSession() resolves with the
        // same data. Skip re-applying it to avoid a duplicate profile
        // fetch and an extra render — but still use it to mark the
        // listener as "settled" for authReady.
        const isInitial = event === 'INITIAL_SESSION';
        const sameAsCurrent =
          (currentSession?.user?.id ?? null) === (sessionRef.current?.user?.id ?? null);

        if (!(isInitial && sameAsCurrent && gotInitialSessionRef.current)) {
          applySession(currentSession, event);
        }
        setLoading(false);
        if (!gotInitialEventRef.current) {
          gotInitialEventRef.current = true;
          if (gotInitialSessionRef.current) setAuthReady(true);
        }

        // Resolve any in-flight signOut() waiter the moment the SDK
        // confirms the sign-out. This is what flips signingOut back to
        // false in AuthContext (and unblocks AuthGuard).
        if (event === 'SIGNED_OUT') {
          const initiatedHere = !!signedOutResolverRef.current;
          signedOutResolverRef.current?.();

          // Single source of truth for the "Signed out" toast — fires
          // exactly once per SIGNED_OUT event regardless of whether the
          // sign-out was initiated in this tab or another.


          // Cross-tab sync: Supabase mirrors auth state across tabs via
          // its shared storage key, so SIGNED_OUT also fires in tabs
          // that did NOT initiate the sign-out (e.g. session expired,
          // or user signed out from another tab). Run the same UX:
          // flash the spinner and redirect to /login.
          if (!initiatedHere) {
            setSigningOut(true);
            profileRequestRef.current += 1;
            setUserSafe(null);
            setSessionSafe(null);
            setProfileSafe(null);
            try { queryClient.clear(); } catch { /* ignore */ }
            purgeSupabaseAuthStorage();
            setSigningOut(false);
            navigateRef.current('/login', { replace: true });
          }
        }
      }
    );

    // Explicitly restore the persisted session after the listener is active.
    // Guarded so StrictMode's double-mount in dev cannot trigger two
    // concurrent session checks.
    if (!gotInitialSessionRef.current) {
      supabase.auth.getSession()
        .then(({ data: { session: initialSession }, error }) => {
          if (cancelled) return;
            hasSession: !!initialSession,
            userId: initialSession?.user?.id,
            error: error?.message,
          });
          applySession(initialSession, 'getSession');
          setLoading(false);
          gotInitialSessionRef.current = true;
          if (gotInitialEventRef.current) setAuthReady(true);
        })
        .catch(error => {
          if (cancelled) return;
          applySession(null, 'getSession:error');
          setLoading(false);
          gotInitialSessionRef.current = true;
          if (gotInitialEventRef.current) setAuthReady(true);
        });
    }

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, queryClient]);

  const handleUpdateProfile = async (data: Partial<Profile>) => {
    const currentUser = userRef.current;
    if (!currentUser) throw new Error("No user logged in");
    // Bump token BEFORE awaiting so any in-flight applySession fetch is
    // discarded and cannot overwrite our newer write.
    const requestId = ++profileRequestRef.current;
    const updatedProfile = await updateUserProfile(currentUser.id, data);
    // Drop our own write if a newer op (e.g. user signed out) superseded us.
    if (requestId !== profileRequestRef.current) return updatedProfile;
    if (userRef.current?.id !== currentUser.id) return updatedProfile;
    if (updatedProfile) {
      setProfileSafe(updatedProfile);
    }
    return updatedProfile;
  };

  const refreshProfile = async (): Promise<Profile | null> => {
    const currentUser = userRef.current;
    if (!currentUser) return null;
    const requestId = ++profileRequestRef.current;
    const userId = currentUser.id;
    const userProfile = await fetchUserProfile(userId);
    // Stale-result guards: token bumped OR user changed underneath us.
    if (requestId !== profileRequestRef.current) return profileRef.current;
    if (userRef.current?.id !== userId) return profileRef.current;
    if (userProfile !== null) {
      setProfileSafe(userProfile as Profile | null);
      return userProfile as Profile | null;
    }
    // Fetch failed — keep existing profile.
    return profileRef.current;
  };

  // Shared completion rule + Supabase-direct fetch — see lib/auth/profileCompletion.
  // All redirect decisions across the app go through these helpers so the
  // /dashboard vs /complete-profile choice is computed identically everywhere.
  const isProfileComplete = isComplete(profile);

  /**
   * Single source of truth for "where should the user be after auth?".
   * Queries Supabase directly (via fetchProfileCompletion) so the decision
   * is based on freshly persisted data — never stale React state — AND
   * ties its answer to the user that was current when the call started:
   * if the user changes (sign-out, account switch) mid-resolve, returns
   * the appropriate fallback.
   */
  const resolvePostAuthRoute = async (returnTo: string = '/dashboard'): Promise<string> => {
    const startUser = userRef.current;
    if (!startUser) return '/login';
    const complete = await fetchProfileCompletion(startUser.id);
    // Refresh local profile state in the background so subsequent renders
    // (and isProfileComplete consumers) see the same answer we just used.
    void refreshProfile();
    const nowUser = userRef.current;
    if (!nowUser) return '/login';
    if (nowUser.id !== startUser.id) {
      // A different user is signed in now — recompute against current state.
      return resolveCompletionRoute(isComplete(profileRef.current), returnTo);
    }
    return resolveCompletionRoute(complete, returnTo);
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    profileLoading,
    authReady,
    signingOut,
    isProfileComplete,
    refreshProfile,
    resolvePostAuthRoute,
    signIn,
    signInWithMagicLink,
    signUp,
    signOut,
    updateProfile: handleUpdateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
