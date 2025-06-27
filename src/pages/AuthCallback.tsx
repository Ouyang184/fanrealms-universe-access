
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
        
        // Check URL parameters and hash for recovery indicators BEFORE getting session
        const urlSearchParams = new URLSearchParams(window.location.search);
        const urlHashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const typeFromSearch = urlSearchParams.get('type') || searchParams.get('type');
        const typeFromHash = urlHashParams.get('type');
        
        console.log("AuthCallback: Checking for recovery type", { 
          typeFromSearch, 
          typeFromHash,
          fullSearch: window.location.search,
          fullHash: window.location.hash 
        });
        
        // Check if this is a recovery flow BEFORE processing the session
        const isRecovery = typeFromSearch === 'recovery' || 
                          typeFromHash === 'recovery' ||
                          window.location.search.includes('type=recovery') ||
                          window.location.hash.includes('type=recovery');
        
        console.log("AuthCallback: Is recovery flow detected?", isRecovery);
        
        if (isRecovery) {
          console.log("AuthCallback: Recovery flow detected, redirecting to reset password");
          navigate('/reset-password', { replace: true });
          return;
        }
        
        // For non-recovery flows, get the session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("AuthCallback: Error getting session", error);
          throw error;
        }
        
        console.log("AuthCallback: Session data", { 
          hasSession: !!data?.session, 
          user: data?.session?.user?.email 
        });
        
        if (data?.session?.user) {
          // Regular authentication success
          toast({
            title: "Authentication successful",
            description: "You have been successfully authenticated.",
          });
          navigate("/home", { replace: true });
        } else {
          // No session found, redirect to login
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
