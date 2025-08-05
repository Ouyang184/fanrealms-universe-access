
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AuthResult } from '@/lib/types/auth';

export const useAuthFunctions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const signIn = useCallback(async (email: string, password: string, captchaToken?: string): Promise<AuthResult> => {
    try {
      console.log("useAuthFunctions: Attempting sign in for:", email);
      console.log("useAuthFunctions: Captcha token:", captchaToken ? `${captchaToken.substring(0, 20)}...` : "none");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken
        }
      });

      if (error) {
        console.error("useAuthFunctions: Sign in error:", error);
        throw error;
      }
      
      console.log("useAuthFunctions: Sign in result:", data);
      
      // Check if MFA is required
      if (data.session === null && data.user?.factors?.length) {
        console.log("useAuthFunctions: MFA challenge required");
        
        return {
          success: false,
          error: { message: "MFA_CHALLENGE_REQUIRED" },
          mfaRequired: true,
          userId: data.user.id,
          factors: data.user.factors
        };
      }
      
      // If we have a session, check for email 2FA
      if (data.session && data.user) {
        console.log("useAuthFunctions: Checking for email 2FA requirement");
        
        // Check if user has email 2FA enabled
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email_2fa_enabled')
          .eq('id', data.user.id)
          .single();
        
        if (userError) {
          console.error("useAuthFunctions: Error checking email 2FA status:", userError);
        } else if (userData?.email_2fa_enabled) {
          console.log("useAuthFunctions: Email 2FA required, signing out temporarily");
          
          // Sign out the user temporarily
          await supabase.auth.signOut({ scope: 'local' });
          
          // Trigger email 2FA challenge
          console.log("useAuthFunctions: Calling send-code function...");
          const { data: emailData, error: emailError } = await supabase.functions.invoke('send-code', {
            body: { email: data.user.email }
          });
          
          console.log("useAuthFunctions: Send-code response:", { emailData, emailError });
          
          if (emailError) {
            console.error("useAuthFunctions: Error sending 2FA email:", emailError);
            throw new Error("Failed to send 2FA verification code");
          }
          
          return {
            success: false,
            error: { message: "EMAIL_2FA_REQUIRED" },
            emailMfaRequired: true,
            email: data.user.email
          };
        }
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

  const signUp = useCallback(async (email: string, password: string, captchaToken?: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          captchaToken
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
