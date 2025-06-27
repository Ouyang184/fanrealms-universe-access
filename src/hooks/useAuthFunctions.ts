
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
      console.log("useAuthFunctions: Attempting sign in for:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("useAuthFunctions: Sign in error:", error);
        throw error;
      }
      
      console.log("useAuthFunctions: Sign in successful:", data.user?.email);
      
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
      console.error("useAuthFunctions: Login error:", error);
      
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
  }, [toast]);

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
          
          // Navigate to preferences page after successful signup
          navigate('/preferences');
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
      console.log("useAuthFunctions: Attempting sign out");
      
      await supabase.auth.signOut({ scope: 'local' });
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
      });
      
      // Navigate to the root page
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error("useAuthFunctions: Sign out error:", error);
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
