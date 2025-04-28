
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/lib/supabase';

export const useAuthFunctions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast({
        title: "Login successful",
        description: "You are now logged in.",
      });
      
      return data;
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || "An error occurred during login. Please try again.";
      if (error.message?.includes("Invalid login")) {
        errorMessage = "Invalid email or password. Please check your credentials or sign up if you don't have an account.";
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    try {
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
    }
  }, [toast]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;
      
      if (data.session) {
        // User is immediately logged in (email confirmation is disabled)
        toast({
          title: "Account created!",
          description: "Your account has been created successfully.",
        });
        
        // Create the user profile if it doesn't exist
        if (data.user) {
          const { error: userError } = await supabase
            .from('users')
            .insert([
              { 
                id: data.user.id, 
                email: data.user.email || '',
                username: email.split('@')[0],
              }
            ])
            .single();

          if (userError) {
            console.error('Error creating user profile:', userError);
          }
        }
      } else {
        // Email confirmation is required
        toast({
          title: "Registration successful!",
          description: "Please check your email to confirm your account.",
        });
      }
      
      return data;
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || "An error occurred during registration. Please try again.";
      if (error.message?.includes("already registered")) {
        errorMessage = "This email is already registered. Please try logging in instead.";
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
      });
      navigate('/', { replace: true });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message || "An error occurred during sign out. Please try again.",
        variant: "destructive"
      });
    }
  }, [navigate, toast]);

  return {
    signIn,
    signInWithMagicLink,
    signUp,
    signOut,
  };
};
