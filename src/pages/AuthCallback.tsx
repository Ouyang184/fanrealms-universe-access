
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

      // Step 2: Parse and detect recovery
      const currentHash = window.location.hash;
      const hashParams = new URLSearchParams(currentHash.substring(1));
      const urlParams = new URLSearchParams(window.location.search);
      
      const isRecoveryFromHash = hashParams.get('type') === 'recovery';
      const isRecoveryFromSearch = urlParams.get('type') === 'recovery';
      const hasAccessToken = hashParams.has('access_token') || currentHash.includes('access_token');
      
      console.log("AuthCallback: Recovery detection", {
        isRecoveryFromHash,
        isRecoveryFromSearch,
        hasAccessToken,
        hashParams: hashParams.toString(),
        urlParams: urlParams.toString()
      });

      // Step 3: Immediate recovery redirect
      if (isRecoveryFromHash || isRecoveryFromSearch) {
        console.log("AuthCallback: Recovery flow detected, redirecting immediately to /reset-password");
        window.location.replace('/reset-password');
        return;
      }

      // Step 4: Normal auth flow - only after hash check and recovery redirect logic
      try {
        console.log("AuthCallback: Normal auth flow, getting session");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("AuthCallback: Error getting session:", error);
          toast({
            title: "Authentication failed",
            description: error.message || "Failed to process authentication.",
            variant: "destructive"
          });
          navigate("/login", { replace: true });
          return;
        }
        
        if (data.session?.user) {
          console.log("AuthCallback: Session found, redirecting to home");
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
        
      } catch (error) {
        console.error("AuthCallback: Unexpected error:", error);
        toast({
          title: "Authentication error",
          description: "An unexpected error occurred. Please try again.",
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
