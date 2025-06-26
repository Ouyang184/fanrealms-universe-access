
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { AuthResult } from '@/lib/types/auth';
import { 
  signInWithCredentials, 
  signUpWithCredentials, 
  signInWithMagicLink as magicLinkService,
  signOutUser 
} from '@/lib/auth/authService';
import { 
  getSignInErrorMessage, 
  getSignUpErrorMessage, 
  getMagicLinkErrorMessage, 
  getSignOutErrorMessage 
} from '@/lib/auth/authErrorHandler';

export const useAuthFunctions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await signInWithCredentials(email, password);
      
      toast({
        title: "Login successful",
        description: "You are now logged in.",
      });
      
      return result;
    } catch (error: any) {
      console.error("Login error:", error);
      
      const errorMessage = getSignInErrorMessage(error);
      
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
      const result = await signUpWithCredentials(email, password);
      
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account before signing in.",
      });
      
      return result;
      
    } catch (error: any) {
      console.error("Signup error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      const errorMessage = getSignUpErrorMessage(error);
      
      const toastTitle = error.message?.includes('timeout') ? "Signup timeout" : "Account creation failed";
      
      toast({
        title: toastTitle,
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
      await magicLinkService(email);
      
      toast({
        title: "Magic link sent!",
        description: "Check your email for the login link.",
      });
      
    } catch (error: any) {
      const errorMessage = getMagicLinkErrorMessage(error);
      
      toast({
        title: "Failed to send magic link",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      await signOutUser();
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
      });
      
      navigate('/', { replace: true });
    } catch (error: any) {
      const errorMessage = getSignOutErrorMessage(error);
      
      toast({
        title: "Sign out failed",
        description: errorMessage,
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
