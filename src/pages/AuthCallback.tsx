
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log("AuthCallback: Starting auth callback process");
      console.log("AuthCallback: Current URL:", window.location.href);
      console.log("AuthCallback: Initial hash:", window.location.hash);
      console.log("AuthCallback: Search params:", searchParams.toString());

      // Step 1: Wait for URL hash with polling
      let hashCheckAttempts = 0;
      const maxAttempts = 10; // 2 seconds with 200ms intervals
      
      const waitForHash = () => {
        return new Promise<void>((resolve) => {
          const checkHash = () => {
            hashCheckAttempts++;
            const currentHash = window.location.hash;
            console.log(`AuthCallback: Hash check attempt ${hashCheckAttempts}:`, currentHash);
            
            // Check if hash contains auth tokens or recovery type
            const hasAuthData = currentHash.includes('access_token') || 
                               currentHash.includes('type=recovery') ||
                               searchParams.get('type') === 'recovery';
            
            if (hasAuthData || hashCheckAttempts >= maxAttempts) {
              console.log("AuthCallback: Hash check complete", { hasAuthData, attempts: hashCheckAttempts });
              resolve();
            } else {
              setTimeout(checkHash, 200);
            }
          };
          checkHash();
        });
      };

      // Wait for hash to be populated
      await waitForHash();

      // Step 2: Get session first to check for recovery context
      let sessionData;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("AuthCallback: Error getting session:", error);
          throw error;
        }
        sessionData = data;
      } catch (error) {
        console.error("AuthCallback: Session error:", error);
        toast({
          title: "Authentication failed",
          description: "Failed to process authentication. Please try again.",
          variant: "destructive"
        });
        navigate("/login", { replace: true });
        return;
      }

      // Step 3: Enhanced recovery detection
      const currentHash = window.location.hash;
      const hashParams = new URLSearchParams(currentHash.substring(1));
      const urlParams = new URLSearchParams(window.location.search);
      
      // Multiple ways to detect recovery flow
      const isRecoveryFromHash = hashParams.get('type') === 'recovery';
      const isRecoveryFromSearch = urlParams.get('type') === 'recovery';
      const hasRecoveryInUrl = window.location.href.includes('type=recovery');
      
      // Check if this is a recovery session by examining the session metadata
      const isRecoverySession = sessionData.session?.user?.app_metadata?.provider === 'email' && 
                               sessionData.session?.user?.user_metadata?.email_change_confirm_status === undefined &&
                               sessionData.session?.user?.aud === 'authenticated';
      
      // Additional check: if we have a fresh session but came from /forgot-password
      const referrer = document.referrer;
      const cameFromForgotPassword = referrer.includes('/forgot-password');
      
      const isRecoveryFlow = isRecoveryFromHash || isRecoveryFromSearch || hasRecoveryInUrl || 
                            (sessionData.session && cameFromForgotPassword);
      
      console.log("AuthCallback: Enhanced recovery detection", {
        isRecoveryFromHash,
        isRecoveryFromSearch,
        hasRecoveryInUrl,
        isRecoverySession,
        cameFromForgotPassword,
        isRecoveryFlow,
        sessionExists: !!sessionData.session,
        userEmail: sessionData.session?.user?.email
      });

      // Step 4: Handle recovery flow
      if (isRecoveryFlow && sessionData.session?.user) {
        console.log("AuthCallback: Recovery flow detected with valid session, redirecting to reset-password");
        navigate("/reset-password", { replace: true });
        return;
      } else if (isRecoveryFlow && !sessionData.session) {
        console.log("AuthCallback: Recovery flow detected but no session");
        toast({
          title: "Password reset failed",
          description: "Invalid or expired reset link. Please request a new one.",
          variant: "destructive"
        });
        navigate("/forgot-password", { replace: true });
        return;
      }

      // Step 5: Normal auth flow
      if (sessionData.session?.user) {
        console.log("AuthCallback: Normal auth flow - session found, redirecting to home");
        toast({
          title: "Authentication successful",
          description: "You have been successfully logged in.",
        });
        navigate("/home", { replace: true });
        return;
      }
      
      // No session found
      console.log("AuthCallback: No session found");
      toast({
        title: "Authentication failed", 
        description: "No valid session found. Please try again.",
        variant: "destructive"
      });
      navigate("/login", { replace: true });
    };

    handleAuthCallback();
  }, [navigate, toast, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-4" />
        <h2 className="text-xl font-medium mb-2">Authenticating...</h2>
        <p className="text-muted-foreground">Please wait while we complete the authentication process.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
