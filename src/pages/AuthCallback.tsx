
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
        
        // First, let Supabase handle the auth callback automatically
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
          // Check if this came from a password recovery email
          // Password recovery emails have specific URL patterns or we can check user metadata
          const searchString = window.location.search;
          const hashString = window.location.hash;
          
          console.log("AuthCallback: URL details", { searchString, hashString });
          
          // Check if this is a recovery flow by looking for recovery-related parameters
          const isRecovery = searchString.includes('type=recovery') || 
                           hashString.includes('type=recovery') ||
                           searchParams.get('type') === 'recovery';
          
          console.log("AuthCallback: Is recovery flow?", isRecovery);
          
          if (isRecovery) {
            console.log("AuthCallback: Redirecting to reset password page");
            navigate('/reset-password', { replace: true });
            return;
          }
          
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
