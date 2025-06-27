
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
      console.log("AuthCallback: Processing auth callback");
      console.log("AuthCallback: Current URL:", window.location.href);
      console.log("AuthCallback: Hash:", window.location.hash);
      console.log("AuthCallback: Search:", window.location.search);
      
      // Get all parameters from both URL and hash
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
      const code = urlParams.get('code') || hashParams.get('code');
      const type = urlParams.get('type') || hashParams.get('type');
      const error = urlParams.get('error') || hashParams.get('error');
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
      
      console.log("AuthCallback: Parameters found:", { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken, 
        hasCode: !!code, 
        type,
        error,
        errorDescription
      });
      
      // Check for errors first
      if (error) {
        console.error("AuthCallback: Auth error:", error, errorDescription);
        toast({
          title: "Authentication failed",
          description: errorDescription || error,
          variant: "destructive"
        });
        navigate("/login", { replace: true });
        return;
      }
      
      // Check for recovery flow - ANY indication this is a password reset
      const isRecoveryFlow = 
        type === 'recovery' ||
        window.location.href.includes('type=recovery') ||
        accessToken || // Password reset emails include access tokens
        code; // Or authorization codes
      
      console.log("AuthCallback: Is recovery flow:", isRecoveryFlow);
      
      // If this is a recovery flow, redirect to reset-password with all parameters
      if (isRecoveryFlow) {
        console.log("AuthCallback: Redirecting to reset-password for recovery flow");
        const currentParams = window.location.search;
        const currentHash = window.location.hash;
        const redirectUrl = `/reset-password${currentParams}${currentHash}`;
        console.log("AuthCallback: Redirect URL:", redirectUrl);
        window.location.replace(redirectUrl);
        return;
      }
      
      // For regular auth flows, process the session
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("AuthCallback: Error getting session", error);
          toast({
            title: "Authentication failed",
            description: "Unable to retrieve session.",
            variant: "destructive"
          });
          navigate("/login", { replace: true });
          return;
        }
        
        if (!data.session) {
          console.log("AuthCallback: No session found");
          toast({
            title: "Authentication failed",
            description: "Please try logging in again.",
            variant: "destructive"
          });
          navigate("/login", { replace: true });
          return;
        }
        
        console.log("AuthCallback: Session loaded successfully, redirecting to /home");
        toast({
          title: "Authentication successful",
          description: "You have been successfully authenticated.",
        });
        navigate("/home", { replace: true });
        
      } catch (error) {
        console.error("Auth callback error:", error);
        toast({
          title: "Authentication error",
          description: "An error occurred during authentication. Please try again.",
          variant: "destructive"
        });
        navigate("/login", { replace: true });
      }
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
