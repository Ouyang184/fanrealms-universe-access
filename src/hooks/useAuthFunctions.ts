
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AuthResult } from '@/lib/types/auth';

export const useAuthFunctions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
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
      
      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "An error occurred during login";
      
      if (error.message?.includes("Invalid login")) {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error.message?.includes("timeout") || error.message?.includes("504") || error.status === 504) {
        errorMessage = "Server is busy. Please try again in a moment.";
      } else if (error.message && error.message !== "{}") {
        errorMessage = error.message;
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive"
      });

      return {
        success: false,
        error: { message: errorMessage }
      };
    }
  }, [toast, navigate]);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      console.log('Starting signup process for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            signup_timestamp: new Date().toISOString(),
            allow_multiple_from_ip: true,
            ip_restriction_disabled: true
          }
        }
      });

      console.log('Supabase signup response:', { data, error });

      if (error) {
        console.error('Supabase signup error:', error);
        
        // Handle specific error types
        if (error.status === 504 || error.name === 'AuthRetryableFetchError') {
          throw new Error('Server is experiencing high traffic. Please wait a moment and try again.');
        }
        
        if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
          throw new Error('Multiple signup attempts detected. Please wait a moment before trying again.');
        }
        
        if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
          throw new Error('This email is already registered. Please try logging in instead.');
        }
        
        if (error.message?.includes('invalid email')) {
          throw new Error('Please enter a valid email address.');
        }

        // Handle empty or malformed error messages
        if (!error.message || error.message === '{}' || error.message.trim() === '') {
          throw new Error('Unable to create account at this time. Please try again later.');
        }
        
        throw error;
      }
      
      console.log('Signup successful, user data:', data.user);
      
      // Show success message immediately
      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account before signing in.",
      });
      
      return {
        success: true,
        user: data.user!,
        session: data.session
      };
      
    } catch (error: any) {
      console.error("Signup error:", error);
      
      let errorMessage = "Unable to create account at this time";
      
      // Handle different error types
      if (error.message) {
        if (error.message === '{}' || error.message.trim() === '') {
          errorMessage = "Server error occurred. Please try again in a few moments.";
        } else if (error.message.includes("already registered")) {
          errorMessage = "This email is already registered. Please try logging in instead.";
        } else if (error.message.includes("rate limit") || error.message.includes("too many")) {
          errorMessage = "Multiple signup attempts detected. Please wait a moment before trying again.";
        } else if (error.message.includes("Server is experiencing")) {
          errorMessage = error.message;
        } else if (error.message.includes("invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Account creation failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      return {
        success: false,
        error: { message: errorMessage }
      };
    }
  }, [toast]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            magic_link_ip_allowed: true
          }
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

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      
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
