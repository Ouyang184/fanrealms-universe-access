
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
      console.log("AuthCallback: Search params:", window.location.search);
      console.log("AuthCallback: Hash params:", window.location.hash);
      
      // Get all parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
      const type = urlParams.get('type') || hashParams.get('type');
      const error = urlParams.get('error') || hashParams.get('error');
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
      
      console.log("AuthCallback: Parameters found:", { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken, 
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
      
      // Handle recovery flow (password reset) - this is the key fix
      if (type === 'recovery' && accessToken && refreshToken) {
        console.log("AuthCallback: Recovery flow detected with tokens");
        
        try {
          // Set the session from the tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) {
            console.error("AuthCallback: Session error:", sessionError);
            toast({
              title: "Session error",
              description: "Failed to establish recovery session. Please try requesting a new password reset.",
              variant: "destructive"
            });
            navigate("/forgot-password", { replace: true });
            return;
          }
          
          console.log("AuthCallback: Recovery session established successfully");
          console.log("AuthCallback: Redirecting to reset-password");
          
          // Navigate to reset password page
          navigate("/reset-password", { replace: true });
          return;
        } catch (error) {
          console.error("AuthCallback: Recovery session error:", error);
          toast({
            title: "Authentication error",
            description: "Failed to process password reset. Please try again.",
            variant: "destructive"
          });
          navigate("/forgot-password", { replace: true });
          return;
        }
      }
      
      // If we have tokens but no type, try to process them anyway
      if (accessToken && refreshToken && !type) {
        console.log("AuthCallback: Tokens found without type, attempting session");
        
        try {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) throw sessionError;
          
          // Check if this might be a recovery session
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.log("AuthCallback: Session established, redirecting to reset-password as fallback");
            navigate("/reset-password", { replace: true });
            return;
          }
        } catch (error) {
          console.error("AuthCallback: Token processing error:", error);
        }
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
          console.log("AuthCallback: No session found, redirecting to login");
          toast({
            title: "Authentication failed",
            description: "Please try logging in again.",
            variant: "destructive"
          });
          navigate("/login", { replace: true });
          return;
        }
        
        console.log("AuthCallback: Regular session loaded successfully, redirecting to /home");
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
