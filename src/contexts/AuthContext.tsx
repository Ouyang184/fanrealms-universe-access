
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/lib/types/auth';
import { useAuthFunctions } from '@/hooks/useAuthFunctions';
import { useProfile } from '@/hooks/useProfile';
import type { AuthContextType } from '@/lib/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
  const signOut = React.useCallback(async () => {
    setSigningOut(true);
    // Bump the request token so any in-flight profile fetch is dropped on
    // arrival and cannot resurrect a profile after sign-out.
    profileRequestRef.current += 1;
    setUserSafe(null);
    setSessionSafe(null);
    setProfileSafe(null);

    // Wait for the actual SIGNED_OUT event before lowering the flag — that
    // is the SDK's signal that storage and tokens have been cleared. If
    // the event never arrives (network hiccup, Supabase throws), fall
    // back to a 4s timeout so signingOut can never get stuck on.
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
      setSigningOut(false);
    }
  }, [rawSignOut]);

  useEffect(() => {
    let cancelled = false;

    console.log('[AUTH][Context] Setting up auth state management', {
      href: window.location.href,
      pathname: window.location.pathname,
    });

    const applySession = (currentSession: Session | null, source: string) => {
      if (cancelled) return;

      setSessionSafe(currentSession);
      setUserSafe(currentSession?.user ?? null);

      const requestId = ++profileRequestRef.current;
      const userId = currentSession?.user?.id ?? null;

      if (userId) {
        // Defer to next tick so React commits the user/session change first.
        setTimeout(() => {
          fetchUserProfile(userId).then(userProfile => {
            if (cancelled) return;
            // Discard if a newer auth/profile op has started OR the user
            // id has changed mid-flight (e.g. fast user switch).
            if (requestId !== profileRequestRef.current) return;
            if (userRef.current?.id !== userId) return;
            console.log('[AUTH][Context] Profile fetch', { source, found: !!userProfile });
            setProfileSafe(userProfile);
          });
        }, 0);
      } else {
        setProfileSafe(null);
      }
    };

    // Set up listener before getSession so session restoration events cannot be missed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('[AUTH][Context] onAuthStateChange', {
          event,
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          pathname: window.location.pathname,
        });

        applySession(currentSession, event);
        setLoading(false);
        gotInitialEventRef.current = true;
        if (gotInitialSessionRef.current) setAuthReady(true);

        // Resolve any in-flight signOut() waiter the moment the SDK
        // confirms the sign-out. This is what flips signingOut back to
        // false in AuthContext (and unblocks AuthGuard).
        if (event === 'SIGNED_OUT') {
          signedOutResolverRef.current?.();
        }
      }
    );

    // Explicitly restore the persisted session after the listener is active.
    supabase.auth.getSession()
      .then(({ data: { session: initialSession }, error }) => {
        console.log('[AUTH][Context] Initial getSession()', {
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
        console.error('[AUTH][Context] Error getting session:', error);
        applySession(null, 'getSession:error');
        setLoading(false);
        gotInitialSessionRef.current = true;
        if (gotInitialEventRef.current) setAuthReady(true);
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

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

  const isComplete = (p: Profile | null | undefined) =>
    !!(p?.display_name && p.display_name.trim());

  const isProfileComplete = isComplete(profile);

  /**
   * Single source of truth for "where should the user be after auth?".
   * Re-fetches the profile so the decision is based on freshly persisted
   * data, not stale React state, AND ties its answer to the user that
   * was current when the call started — if the user changes (sign-out,
   * account switch) mid-resolve, returns the appropriate fallback.
   */
  const resolvePostAuthRoute = async (returnTo: string = '/dashboard'): Promise<string> => {
    const startUser = userRef.current;
    if (!startUser) return '/login';
    const fresh = await refreshProfile();
    // If the user changed underneath us, the original answer is meaningless.
    const nowUser = userRef.current;
    if (!nowUser) return '/login';
    if (nowUser.id !== startUser.id) {
      // A different user is signed in now — recompute against current state.
      return isComplete(profileRef.current)
        ? returnTo
        : `/complete-profile?returnTo=${encodeURIComponent(returnTo)}`;
    }
    if (!isComplete(fresh)) {
      return `/complete-profile?returnTo=${encodeURIComponent(returnTo)}`;
    }
    return returnTo;
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
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
