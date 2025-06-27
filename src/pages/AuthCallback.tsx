
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
      console.log("AuthCallback: Search params:", searchParams.toString());
      console.log("AuthCallback: Hash:", window.location.hash);
      
      try {
        // Let Supabase handle the auth callback automatically
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
        
        // Check if this is a password recovery session
        if (data.session?.user) {
          // Check URL parameters to determine if this is a recovery flow
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const type = urlParams.get('type') || hashParams.get('type');
          
          console.log("AuthCallback: Session found, type:", type);
          
          if (type === 'recovery') {
            console.log("AuthCallback: Recovery flow detected, redirecting to reset-password");
            navigate("/reset-password", { replace: true });
            return;
          }
          
          // For regular login, redirect to home
          console.log("AuthCallback: Regular auth flow, redirecting to home");
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
