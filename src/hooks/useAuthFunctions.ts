
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
        errorMessage = "Server is temporarily overloaded. Please try again in a few minutes.";
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
      console.log('Starting ULTRA-OPTIMIZED signup process for:', email);
      
      // Reduced timeout to 10 seconds to fail faster
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Signup timeout after 10 seconds - server overloaded')), 10000);
      });
      
      // Absolute minimal signup with no extra options
      const signupPromise = supabase.auth.signUp({
        email,
        password
        // Removed ALL options to minimize processing time
      });

      const { data, error } = await Promise.race([signupPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Supabase signup error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack
        });
        
        // Enhanced error handling for specific signup issues
        if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
          throw new Error('This email is already registered. Please try logging in instead.');
        }
        
        if (error.message?.includes('invalid email')) {
          throw new Error('Please enter a valid email address.');
        }

        if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
          throw new Error('Too many signup attempts. Please wait a few minutes before trying again.');
        }
        
        // Enhanced server overload detection
        const isServerOverloaded = 
          error.status === 504 || 
          error.status === 502 ||
          error.status === 503 ||
          error.status === 408 ||
          error.name === 'AbortError' ||
          error.name === 'AuthRetryableFetchError' ||
          error.message?.includes('timeout') ||
          error.message?.includes('504') ||
          error.message?.includes('502') ||
          error.message?.includes('503') ||
          error.message?.includes('Gateway') ||
          error.message?.includes('upstream') ||
          error.message?.includes('context deadline') ||
          error.message === '{}' ||
          !error.message ||
          error.message.trim() === '';
        
        if (isServerOverloaded) {
          throw new Error('Supabase is overloaded. Database optimizations applied. Please wait 30 seconds and try again.');
        }
        
        throw new Error(error.message || 'Unable to create account. Please try again.');
      }
      
      console.log('ULTRA-OPTIMIZED signup successful:', data.user?.id);
      
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account before signing in.",
      });
      
      return {
        success: true,
        user: data.user!,
        session: data.session
      };
      
    } catch (error: any) {
      console.error("Signup error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Handle timeout errors specifically
      if (error.message?.includes('timeout') || error.message?.includes('10 seconds')) {
        const errorMessage = "Signup timed out after 10 seconds. Supabase may be experiencing high traffic. Try again in 30 seconds.";
        
        toast({
          title: "Signup timeout",
          description: errorMessage,
          variant: "destructive"
        });
        
        return {
          success: false,
          error: { message: errorMessage }
        };
      }
      
      const errorMessage = error.message || "Unable to create account. Please try again.";
      
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
