
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;
      
      if (data.session) {
        toast({
          title: "Account created!",
          description: "Your account has been created successfully.",
        });
        
        if (data.user) {
          const { error: userError } = await supabase
            .from('users')
            .insert([{ 
              id: data.user.id, 
              email: data.user.email || '',
              username: email.split('@')[0],
            }])
            .single();

          if (userError) {
            console.error('Error creating user profile:', userError);
            throw userError;
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
          session: data.session!
        };
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      
      const errorMessage = error.message?.includes("already registered")
        ? "This email is already registered. Please try logging in instead."
        : error.message || "An error occurred during registration";
      
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
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
      });
      navigate('/', { replace: true }); // Changed from '/logout' to '/'
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
