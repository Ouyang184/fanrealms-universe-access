
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log("AuthCallback: Processing auth callback");
      
      // Get the current URL to check for recovery indicators
      const currentUrl = window.location.href;
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchType = searchParams.get('type');
      const hashType = hashParams.get('type');
      
      console.log("AuthCallback: URL analysis", {
        currentUrl,
        searchType,
        hashType,
        fullHash: window.location.hash,
        fullSearch: window.location.search
      });
      
      // Check for recovery flow indicators
      const isRecoveryFlow = 
        searchType === 'recovery' ||
        hashType === 'recovery' ||
        currentUrl.includes('type=recovery') ||
        currentUrl.includes('recovery') ||
        hashParams.get('access_token') || 
        searchParams.get('access_token');
      
      console.log("AuthCallback: Recovery flow detection:", isRecoveryFlow);
      
      // If this is a recovery flow, redirect immediately with URL cleanup
      if (isRecoveryFlow) {
        console.log("Redirecting to /reset-password for recovery flow...");
        // Clean up the URL to remove tokens from history
        window.history.replaceState({}, document.title, "/reset-password");
        window.location.replace('/reset-password');
        return;
      }
      
      // For regular auth flows, wait for Supabase to process session tokens
      // Give Supabase time to process the URL hash tokens before calling getSession
      setTimeout(async () => {
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
      }, 500); // Wait 0.5s to allow Supabase to process the URL tokens
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
