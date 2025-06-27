
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

      try {
        // Check URL parameters to determine the type of callback
        const type = searchParams.get('type');
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        console.log("AuthCallback: URL params:", {
          type,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken
        });

        // Handle password recovery flow
        if (type === 'recovery' && accessToken && refreshToken) {
          console.log("AuthCallback: Recovery flow detected");
          
          // Set the session with the tokens from URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error("AuthCallback: Error setting recovery session:", error);
            toast({
              title: "Password reset failed",
              description: "Invalid or expired reset link. Please request a new one.",
              variant: "destructive"
            });
            navigate("/forgot-password", { replace: true });
            return;
          }

          if (data.session?.user) {
            console.log("AuthCallback: Recovery session established, redirecting to reset-password");
            navigate("/reset-password", { replace: true });
            return;
          }
        }

        // Handle normal authentication flow
        if (accessToken && refreshToken && type !== 'recovery') {
          console.log("AuthCallback: Normal auth flow detected");
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error("AuthCallback: Error setting session:", error);
            toast({
              title: "Authentication failed",
              description: error.message || "Failed to process authentication. Please try again.",
              variant: "destructive"
            });
            navigate("/login", { replace: true });
            return;
          }

          if (data.session?.user) {
            console.log("AuthCallback: Normal auth session established, redirecting to home");
            toast({
              title: "Authentication successful",
              description: "You have been successfully logged in.",
            });
            navigate("/home", { replace: true });
            return;
          }
        }

        // Fallback: check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("AuthCallback: Session error:", sessionError);
          toast({
            title: "Authentication failed",
            description: "Failed to get session. Please try again.",
            variant: "destructive"
          });
          navigate("/login", { replace: true });
          return;
        }

        if (session?.user) {
          console.log("AuthCallback: Found existing session, redirecting to home");
          navigate("/home", { replace: true });
          return;
        }

        // No valid session found
        console.log("AuthCallback: No valid session found");
        toast({
          title: "Authentication failed", 
          description: "No valid session found. Please try again.",
          variant: "destructive"
        });
        navigate("/login", { replace: true });

      } catch (error: any) {
        console.error("AuthCallback: Unexpected error:", error);
        toast({
          title: "Authentication failed",
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
