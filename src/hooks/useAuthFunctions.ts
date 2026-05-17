
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { purgeSupabaseAuthStorage } from '@/utils/auth-storage';
import type { AuthResult } from '@/lib/types/auth';

export const useAuthFunctions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const signIn = useCallback(async (email: string, password: string, captchaToken?: string): Promise<AuthResult> => {
    try {
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          ...(captchaToken ? { captchaToken } : {})
        }
      });

      if (error) {
        throw error;
      }
      
      
      // Check if MFA is required
      if (data.session === null && data.user?.factors?.length) {
        
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
        
        // Check if user has email 2FA enabled
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email_2fa_enabled')
          .eq('id', data.user.id)
          .maybeSingle();
        
        if (userError) {
        } else if (userData?.email_2fa_enabled) {

          const userEmail = data.user.email;

          // CRITICAL: sign out BEFORE returning so the JWT does not sit in
          // localStorage where another tab could ride it past protected routes.
          // The session is only re-established after the 2FA code is verified.
          await supabase.auth.signOut({ scope: 'local' });
          purgeSupabaseAuthStorage();

          const { error: emailError } = await supabase.functions.invoke('send-code', {
            body: { email: userEmail }
          });

          if (emailError) {
            throw new Error("Failed to send 2FA verification code. Please try again.");
          }

          return {
            success: false,
            error: { message: "EMAIL_2FA_REQUIRED" },
            emailMfaRequired: true,
            email: userEmail,
          };
        }
      }
      
      
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

  const signUp = useCallback(async (email: string, password: string, captchaToken?: string, fullName?: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?flow=signup`,
          captchaToken,
          data: {
            full_name: fullName,
            name: fullName,
          }
        }
      });

      if (error) throw error;
      
      if (data.session) {
        // Profile row in public.users is auto-created by the
        // on_auth_user_created trigger — no client-side insert needed.
        toast({
          title: "Account created!",
          description: "Your account has been created successfully.",
        });

        navigate('/library', { replace: true });

        return {
          success: true,
          user: data.user!,
          session: data.session!
        };
      } else {
        // Email confirmation is required by Supabase — no session yet.
        // Tell the caller so it can show a "check your email" screen instead
        // of trying to navigate into protected routes.
        toast({
          title: "Verification required",
          description: "Please check your email to confirm your account.",
        });

        return {
          success: true,
          user: data.user!,
          session: undefined,
          needsEmailConfirmation: true,
        };
      }
    } catch (error: any) {
      
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
          emailRedirectTo: `${window.location.origin}/auth/callback?flow=magiclink`,
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

    // Wait for the SIGNED_OUT event before navigating, so AuthContext's
    // user/session state is already null when /login mounts. This avoids
    // a brief flash of authed UI and prevents AuthGuard from bouncing
    // back to /dashboard mid-logout.
    const waitForSignedOut = new Promise<void>((resolve) => {
      const timeout = window.setTimeout(() => {
        sub?.subscription.unsubscribe();
        resolve();
      }, 3000);
      const sub = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
          window.clearTimeout(timeout);
          sub.subscription.unsubscribe();
          resolve();
        }
      }).data;
    });

    try {
      // scope: 'global' revokes the refresh token server-side too, so the
      // session cannot be resumed from another tab/device.
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        // Network/server failure — fall back to local-only sign out so the
        // browser session is still cleared.
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch (error: any) {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        /* ignore */
      }
    }

    // Confirm the SIGNED_OUT event fired (or timed out as a safety net).
    await waitForSignedOut;

    // Belt-and-suspenders: scrub any leftover Supabase auth keys.
    purgeSupabaseAuthStorage();

    // Note: the "Signed out" toast is fired by AuthContext from the
    // SIGNED_OUT auth event so it shows exactly once, whether the
    // sign-out was initiated here or in another tab.

    // Note: navigation to /login is owned by AuthContext.signOut so it
    // only fires after the SIGNED_OUT event (or timeout fallback) has
    // settled. Avoid navigating here to prevent a flash of /login while
    // signingOut is still true.
  }, [toast]);

  return {
    signIn,
    signInWithMagicLink,
    signUp,
    signOut,
  };
};
