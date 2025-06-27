
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
        
        // First, check ALL possible sources for recovery indicators
        const currentUrl = window.location.href;
        const searchString = window.location.search;
        const hashString = window.location.hash;
        
        console.log("AuthCallback: Full URL analysis", {
          currentUrl,
          searchString,
          hashString,
          searchParams: Object.fromEntries(searchParams.entries())
        });
        
        // Comprehensive recovery detection - check multiple sources
        const isRecoveryFlow = 
          // Check URL search params
          searchString.includes('type=recovery') ||
          // Check hash params
          hashString.includes('type=recovery') ||
          // Check React Router search params
          searchParams.get('type') === 'recovery' ||
          // Check full URL for recovery indicators
          currentUrl.includes('type=recovery') ||
          // Check if URL came from password reset email (common pattern)
          currentUrl.includes('recovery') ||
          currentUrl.includes('reset');
        
        console.log("AuthCallback: Recovery flow detection result:", isRecoveryFlow);
        
        // If ANY recovery indicator is found, go to reset password immediately
        if (isRecoveryFlow) {
          console.log("AuthCallback: Recovery flow confirmed - redirecting to reset password");
          navigate('/reset-password', { replace: true });
          return;
        }
        
        // Only process regular authentication if it's NOT a recovery flow
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
