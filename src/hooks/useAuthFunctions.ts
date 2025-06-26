
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

  const signUpWithRetry = useCallback(async (email: string, password: string, retryCount = 0): Promise<any> => {
    const maxRetries = 1; // Reduced to 1 retry for faster feedback
    
    try {
      console.log(`Signup attempt ${retryCount + 1} for:`, email);
      
      // Shorter timeout for quicker failure detection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            signup_timestamp: new Date().toISOString(),
          }
        }
      });

      clearTimeout(timeoutId);
      console.log('Supabase signup response:', { data, error });

      if (error) {
        console.error('Supabase signup error:', error);
        
        // Handle specific error types
        if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
          throw new Error('This email is already registered. Please try logging in instead.');
        }
        
        if (error.message?.includes('invalid email')) {
          throw new Error('Please enter a valid email address.');
        }

        if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
          throw new Error('Too many signup attempts. Please wait a few minutes before trying again.');
        }
        
        // Handle server overload errors (504, timeouts, etc.)
        const isServerOverloaded = 
          error.status === 504 || 
          error.name === 'AuthRetryableFetchError' ||
          error.message?.includes('timeout') ||
          error.message?.includes('504') ||
          error.message === '{}' ||
          !error.message ||
          error.message.trim() === '';
        
        if (isServerOverloaded && retryCount < maxRetries) {
          console.log(`Server overloaded, retrying (attempt ${retryCount + 2}/${maxRetries + 1}) after delay...`);
          
          // Short delay
          const delay = 2000; // 2 seconds
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return await signUpWithRetry(email, password, retryCount + 1);
        }
        
        // For server overload errors that exhausted retries
        if (isServerOverloaded) {
          throw new Error('Supabase authentication servers are currently overloaded due to high traffic. This is a temporary issue. Please try again in a few minutes, or contact support if this persists.');
        }
        
        // For other errors, use the original message or a fallback
        throw new Error(error.message || 'Unable to create account at this time. Please try again later.');
      }
      
      console.log('Signup successful, user data:', data.user);
      return { data, error: null };
      
    } catch (error: any) {
      // If this is already our custom error, re-throw it
      if (error.message && !error.status) {
        throw error;
      }
      
      console.error("Signup network error:", error);
      
      // Handle network/connection errors with retry
      if (retryCount < maxRetries && (error.name === 'AbortError' || error.message?.includes('network'))) {
        console.log(`Network error, retrying signup (attempt ${retryCount + 2}/${maxRetries + 1})...`);
        
        const delay = 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return await signUpWithRetry(email, password, retryCount + 1);
      }
      
      throw new Error('Network connection error. Please check your internet connection and try again.');
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await signUpWithRetry(email, password);
      
      // Show success message
      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account before signing in.",
      });
      
      return {
        success: true,
        user: result.data.user!,
        session: result.data.session
      };
      
    } catch (error: any) {
      console.error("Final signup error:", error);
      
      const errorMessage = error.message || "Unable to create account at this time. Please try again later.";
      
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
  }, [signUpWithRetry, toast]);

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
