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
    const maxRetries = 3; // Increased from 1 to 3
    
    try {
      console.log(`Signup attempt ${retryCount + 1} for:`, email);
      
      // Exponential backoff delay calculation
      const baseDelay = 1000; // 1 second
      const delay = baseDelay * Math.pow(2, retryCount); // 1s, 2s, 4s, 8s
      
      if (retryCount > 0) {
        console.log(`Waiting ${delay}ms before retry attempt ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Increased timeout with exponential scaling
      const timeoutDuration = 10000 + (retryCount * 5000); // 10s, 15s, 20s, 25s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            signup_timestamp: new Date().toISOString(),
            retry_attempt: retryCount + 1,
          }
        }
      });

      clearTimeout(timeoutId);
      console.log('Supabase signup response:', { data, error });

      if (error) {
        console.error('Supabase signup error:', error);
        
        // Handle specific error types first
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
          error.name === 'AuthRetryableFetchError' ||
          error.message?.includes('timeout') ||
          error.message?.includes('504') ||
          error.message?.includes('Gateway') ||
          error.message?.includes('upstream') ||
          error.message === '{}' ||
          !error.message ||
          error.message.trim() === '';
        
        if (isServerOverloaded && retryCount < maxRetries) {
          console.log(`Server overloaded (${error.name || error.status}), retrying attempt ${retryCount + 2}/${maxRetries + 1}...`);
          return await signUpWithRetry(email, password, retryCount + 1);
        }
        
        if (isServerOverloaded) {
          throw new Error('Our authentication servers are experiencing high traffic. This is temporary - please try again in 2-3 minutes, or use a different email address if the issue persists.');
        }
        
        throw new Error(error.message || 'Unable to create account at this time. Please try again later.');
      }
      
      console.log('Signup successful, user data:', data.user);
      return { data, error: null };
      
    } catch (error: any) {
      // If this is already our custom error, re-throw it
      if (error.message && typeof error.message === 'string' && !error.status) {
        throw error;
      }
      
      console.error("Signup network error:", error);
      
      // Handle network/connection errors with retry
      const isNetworkError = 
        error.name === 'AbortError' || 
        error.message?.includes('network') ||
        error.message?.includes('fetch') ||
        error.code === 'NETWORK_ERROR';
      
      if (retryCount < maxRetries && isNetworkError) {
        console.log(`Network error (${error.name}), retrying signup attempt ${retryCount + 2}/${maxRetries + 1}...`);
        return await signUpWithRetry(email, password, retryCount + 1);
      }
      
      throw new Error('Network connection error. Please check your internet connection and try again.');
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await signUpWithRetry(email, password);
      
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
