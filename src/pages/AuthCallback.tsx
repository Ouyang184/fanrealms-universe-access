
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
      try {
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
        
        // Check if this is a recovery/password reset flow
        const isRecoveryFlow = 
          searchType === 'recovery' ||
          hashType === 'recovery' ||
          currentUrl.includes('type=recovery') ||
          currentUrl.includes('recovery');
        
        console.log("AuthCallback: Recovery flow detection:", isRecoveryFlow);
        
        if (isRecoveryFlow) {
          console.log("AuthCallback: Recovery flow detected - redirecting to reset password");
          // For recovery flows, redirect immediately without processing session
          navigate('/reset-password', { replace: true });
          return;
        }
        
        // For regular auth flows, process the session normally
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("AuthCallback: Error getting session", error);
          throw error;
        }
        
        console.log("AuthCallback: Session data for regular auth", { 
          hasSession: !!data?.session, 
          user: data?.session?.user?.email 
        });
        
        if (data?.session?.user) {
          toast({
            title: "Authentication successful",
            description: "You have been successfully authenticated.",
          });
          navigate("/home", { replace: true });
        } else {
          toast({
            title: "Authentication failed",
            description: "Please try logging in again.",
            variant: "destructive"
          });
          navigate("/login", { replace: true });
        }
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
