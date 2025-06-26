
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  username: string;
  email: string;
  website?: string;
  avatar_url?: string;
  profile_picture?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  signIn: async () => {},
  signUp: async () => {},
  signInWithMagicLink: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        console.log('Profile fetched successfully:', data);
        setProfile(data as any);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  useEffect(() => {
    console.log('AuthProvider initializing...');

    // Set up auth state listener - OPTIMIZED to prevent blocking
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      // Synchronous state updates first
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        // Defer profile fetching to not block auth flow
        setTimeout(async () => {
          await fetchProfile(session.user.id);
        }, 100); // Small delay to ensure auth is fully processed
      } else {
        setProfile(null);
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting initial session:', error);
        setLoading(false);
        return;
      }
      
      console.log('Initial session:', session?.user?.id);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        // Defer profile fetching to not block initial load
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 100);
      }
    });

    return () => {
      console.log('AuthProvider cleanup');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    
    console.log('Sign in successful');
  };

  const signUp = async (email: string, password: string, username: string) => {
    console.log('Attempting OPTIMIZED sign up for:', email);
    
    // Use a simplified signup that doesn't block on additional operations
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        // Remove redirect to prevent additional delays
      },
    });
    
    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }
    
    console.log('Sign up successful - profile will be created automatically by trigger');
  };

  const signInWithMagicLink = async (email: string) => {
    console.log('Attempting magic link for:', email);
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    
    if (error) {
      console.error('Magic link error:', error);
      throw error;
    }
    
    console.log('Magic link sent successfully');
  };

  const signOut = async () => {
    console.log('Attempting sign out');
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    
    setUser(null);
    setProfile(null);
    setSession(null);
    console.log('Sign out successful');
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) throw new Error('No user logged in');

    try {
      console.log('Updating profile:', updates);
      
      const { error } = await supabase
        .from('users')
        .update(updates as any)
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(current => current ? { ...current, ...updates } : null);
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    session,
    signIn,
    signUp,
    signInWithMagicLink,
    signOut,
    updateProfile,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
