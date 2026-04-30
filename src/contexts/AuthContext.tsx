
import React, { createContext, useContext, useEffect, useState } from 'react';
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
  
  const { fetchUserProfile, updateProfile: updateUserProfile } = useProfile();
  const { signIn, signInWithMagicLink, signUp, signOut } = useAuthFunctions();

  useEffect(() => {
    console.log('[AUTH][Context] Setting up auth state management', {
      href: window.location.href,
      pathname: window.location.pathname,
    });

    // First, check for existing session
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

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            setTimeout(() => {
              fetchUserProfile(initialSession.user.id).then(userProfile => {
                console.log('[AUTH][Context] Initial profile fetch', { found: !!userProfile });
                if (userProfile) setProfile(userProfile);
              });
            }, 0);
          }
        }

        setLoading(false);
      })
      .catch(error => {
        console.error('[AUTH][Context] Error getting session:', error);
        setLoading(false);
      });

    // Set up auth state listener
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

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id).then(userProfile => {
              console.log('[AUTH][Context] Profile fetch on auth change', { found: !!userProfile });
              if (userProfile) setProfile(userProfile);
            });
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
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

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
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
