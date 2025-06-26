
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
      
      // Added navigation to the onboarding page for new users
      // In a real app, you would check if the user has completed onboarding
      const isNewUser = false; // This would be determined by your user profile data
      
      if (isNewUser) {
        navigate('/onboarding');
      }
      
      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error: any) {
      console.error("Login error:", error);
      
      const errorMessage = error.message?.includes("Invalid login") 
        ? "Invalid email or password. Please check your credentials."
        : error.message || "An error occurred during login";
      
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
      // Remove any potential IP-based restrictions by ensuring clean signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            // Add timestamp to ensure unique signups from same IP
            signup_timestamp: new Date().toISOString(),
            signup_ip_allowed: true
          }
        }
      });

      if (error) {
        // Handle specific signup errors that might be IP-related
        if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
          throw new Error('Multiple signup attempts detected. Please wait a moment before trying again.');
        }
        throw error;
      }
      
      if (data.session) {
        toast({
          title: "Account created!",
          description: "Your account has been created successfully.",
        });
        
        if (data.user) {
          // Create user profile without IP restrictions
          const { error: userError } = await supabase
            .from('users')
            .insert([{ 
              id: data.user.id, 
              email: data.user.email || '',
              username: email.split('@')[0] + '_' + Date.now().toString().slice(-4), // Ensure unique username
            }])
            .single();

          if (userError && !userError.message?.includes('duplicate')) {
            console.error('Error creating user profile:', userError);
            // Don't throw error for profile creation issues, account is still created
          }
          
          // Navigate to onboarding after successful signup
          navigate('/onboarding');
        }

        return {
          success: true,
          user: data.user!,
          session: data.session!
        };
      } else {
        toast({
          title: "Verification required",
          description: "Please check your email to confirm your account.",
        });
        
        return {
          success: true,
          user: data.user!,
          session: data.session
        };
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      
      let errorMessage = error.message || "An error occurred during registration";
      
      // Handle common signup errors that might occur with multiple accounts from same IP
      if (error.message?.includes("already registered")) {
        errorMessage = "This email is already registered. Please try logging in instead.";
      } else if (error.message?.includes("rate limit")) {
        errorMessage = "Too many signup attempts. Please wait a moment before trying again.";
      } else if (error.message?.includes("invalid email")) {
        errorMessage = "Please enter a valid email address.";
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive"
      });

      return {
        success: false,
        error: { message: errorMessage }
      };
    }
  }, [toast, navigate]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            // Allow magic link from any IP
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
      // Only sign out from current session, don't clear localStorage
      await supabase.auth.signOut({ scope: 'local' });
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
      });
      
      // Navigate to the root page
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
