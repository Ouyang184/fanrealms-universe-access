
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
    console.log('Auth state change setup with persistent sessions');
    
    // Check if we're in a recovery flow - if so, don't process sessions here
    const currentUrl = window.location.href;
    const isRecoveryFlow = 
      currentUrl.includes('type=recovery') ||
      currentUrl.includes('recovery') ||
      window.location.pathname === '/reset-password' ||
      window.location.pathname === '/auth/callback';
    
    if (isRecoveryFlow) {
      console.log('AuthContext: Recovery flow detected, skipping session processing');
      setLoading(false);
      return;
    }
    
    // First, check for existing session
    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        console.log('Got initial session:', initialSession ? 'exists' : 'none');
        
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            setTimeout(() => {
              fetchUserProfile(initialSession.user.id).then(userProfile => {
                if (userProfile) {
                  setProfile(userProfile);
                }
              });
            }, 0);
          }
        }
        
        setLoading(false);
      })
      .catch(error => {
        console.error("Error getting session:", error);
        setLoading(false);
      });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state change:', event);
        
        // Skip session updates if we're in a recovery flow
        const isCurrentlyInRecoveryFlow = 
          window.location.href.includes('type=recovery') ||
          window.location.href.includes('recovery') ||
          window.location.pathname === '/reset-password' ||
          window.location.pathname === '/auth/callback';
          
        if (isCurrentlyInRecoveryFlow) {
          console.log('AuthContext: Skipping session update during recovery flow');
          return;
        }
        
        // Handle session changes for normal flows
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user && !isCurrentlyInRecoveryFlow) {
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id).then(userProfile => {
              if (userProfile) {
                setProfile(userProfile);
              }
            });
          }, 0);
        } else {
          // Clear profile when no session exists
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
