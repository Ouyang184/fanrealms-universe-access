
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize session from browser storage
    const initializeSession = async () => {
      try {
        // Get current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          await fetchUserProfile(data.session.user.id);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state change:', event);
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchUserProfile(currentSession.user.id);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        
        // Don't set loading to false on every auth change event
        if (event === 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle redirections after auth state changes
  useEffect(() => {
    if (loading) return;

    const redirectBasedOnAuth = async () => {
      const publicRoutes = ['/', '/login', '/signup'];
      const isPublicRoute = publicRoutes.includes(location.pathname);
      
      // For this demo, we'll consider all profiles as completed
      // Since we're using the 'users' table which doesn't have a profile_completed field
      const hasCompletedProfile = profile !== null;
      
      if (!user && !isPublicRoute) {
        // Redirect to login if not authenticated and trying to access protected route
        navigate('/login');
      } else if (user && isPublicRoute) {
        // If logged in and on a public route (like login/signup), redirect appropriately
        if (hasCompletedProfile) {
          navigate('/dashboard');
        } else {
          navigate('/complete-profile');
        }
      } else if (user && !hasCompletedProfile && location.pathname !== '/complete-profile') {
        // If logged in but profile not completed, and not already on the complete profile page
        navigate('/complete-profile');
      }
    };

    redirectBasedOnAuth();
  }, [user, profile, loading, location.pathname, navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setProfile(data as Profile);
      } else {
        // No profile found, set to null
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Session will be handled by the auth state change listener
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      
      toast({
        title: "Magic link sent!",
        description: "Check your email for the login link.",
      });
      
    } catch (error: any) {
      toast({
        title: "Failed to send magic link",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;

      // Create an empty profile record
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id, 
              username: '', 
              full_name: '', 
              profile_completed: false 
            }
          ]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
      
      toast({
        title: "Registration successful!",
        description: "Please check your email to confirm your account.",
      });
      
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message || "An error occurred during sign out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      setLoading(true);
      if (!user) throw new Error("No user logged in");

      const updates = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Refetch the profile to update the state
      await fetchUserProfile(user.id);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signInWithMagicLink,
    signUp,
    signOut,
    updateProfile
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
