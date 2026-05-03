
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
  const [signingOut, setSigningOut] = useState(false);
  const profileRequestRef = useRef(0);

  const { fetchUserProfile, updateProfile: updateUserProfile } = useProfile();
  const { signIn, signInWithMagicLink, signUp, signOut: rawSignOut } = useAuthFunctions();

  // Wrap signOut so we can set a `signingOut` flag *synchronously* before the
  // async work begins. AuthGuard reads this flag and hides protected UI
  // immediately, so users never see authed content flash on the way to /login.
  const signOut = React.useCallback(async () => {
    setSigningOut(true);
    // Optimistically clear local user/session so any consumer reading
    // `user` re-renders to a logged-out state on the same tick.
    setUser(null);
    setSession(null);
    setProfile(null);
    try {
      await rawSignOut();
    } finally {
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

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      const requestId = ++profileRequestRef.current;
      if (currentSession?.user) {
        setTimeout(() => {
          fetchUserProfile(currentSession.user.id).then(userProfile => {
            if (cancelled || requestId !== profileRequestRef.current) return;
            console.log('[AUTH][Context] Profile fetch', { source, found: !!userProfile });
            setProfile(userProfile);
          });
        }, 0);
      } else {
        setProfile(null);
      }
    };

    // Set up listener before getSession so session restoration events cannot be missed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('[AUTH][Context] onAuthStateChange', {
          event,
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          email: currentSession?.user?.email,
          provider: currentSession?.user?.app_metadata?.provider,
          pathname: window.location.pathname,
        });

        applySession(currentSession, event);
        setLoading(false);
      }
    );

    // Explicitly restore the persisted session after the listener is active.
    const t0 = performance.now();
    supabase.auth.getSession()
      .then(({ data: { session: initialSession }, error }) => {
        const dt = Math.round(performance.now() - t0);
        console.log('[AUTH][Context] Initial getSession()', {
          durationMs: dt,
          hasSession: !!initialSession,
          userId: initialSession?.user?.id,
          email: initialSession?.user?.email,
          expiresAt: initialSession?.expires_at,
          error: error?.message,
        });

        applySession(initialSession, 'getSession');
        setLoading(false);
      })
      .catch(error => {
        if (cancelled) return;
        console.error('[AUTH][Context] Error getting session:', error);
        applySession(null, 'getSession:error');
        setLoading(false);
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const handleUpdateProfile = async (data: Partial<Profile>) => {
    if (!user) throw new Error("No user logged in");
    const updatedProfile = await updateUserProfile(user.id, data);
    if (updatedProfile) {
      setProfile(updatedProfile);
    }
    return updatedProfile;
  };

  const refreshProfile = async (): Promise<Profile | null> => {
    if (!user) return null;
    const requestId = ++profileRequestRef.current;
    const userProfile = await fetchUserProfile(user.id);
    if (requestId !== profileRequestRef.current) return profile; // discard stale
    if (userProfile !== null) {
      setProfile(userProfile as Profile | null);
      return userProfile as Profile | null;
    }
    // Fetch failed — keep existing profile.
    return profile;
  };

  const isComplete = (p: Profile | null | undefined) =>
    !!(p?.display_name && p.display_name.trim());

  const isProfileComplete = isComplete(profile);

  /**
   * Single source of truth for "where should the user be after auth?".
   * Re-fetches the profile so the decision is based on freshly persisted
   * data, not stale React state.
   */
  const resolvePostAuthRoute = async (returnTo: string = '/dashboard'): Promise<string> => {
    if (!user) return '/login';
    const fresh = await refreshProfile();
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
