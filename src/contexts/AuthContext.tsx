
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
    console.log('AuthContext: Setting up auth state management');
    
    // First, check for existing session
    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        console.log('AuthContext: Initial session check:', initialSession ? 'exists' : 'none');
        
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
        console.error("AuthContext: Error getting session:", error);
        setLoading(false);
      });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('AuthContext: Auth state change event:', event);
        console.log('AuthContext: Current session:', currentSession ? 'exists' : 'none');
        
        // Update session and user state
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          console.log('AuthContext: User authenticated, fetching profile');
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id).then(userProfile => {
              if (userProfile) {
                setProfile(userProfile);
                console.log('AuthContext: Profile loaded');
              }
            });
          }, 0);
        } else {
          // Clear profile when no session exists
          console.log('AuthContext: No session, clearing profile');
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
