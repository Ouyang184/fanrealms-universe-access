
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
  const profileRequestRef = useRef(0);
  
  const { fetchUserProfile, updateProfile: updateUserProfile } = useProfile();
  const { signIn, signInWithMagicLink, signUp, signOut } = useAuthFunctions();

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

  const refreshProfile = async () => {
    if (!user) return;
    const requestId = ++profileRequestRef.current;
    const userProfile = await fetchUserProfile(user.id);
    if (requestId !== profileRequestRef.current) return; // discard stale
    if (userProfile !== null) {
      setProfile(userProfile as Profile | null);
    }
    // If null (fetch failed), keep existing profile — don't clear it
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
