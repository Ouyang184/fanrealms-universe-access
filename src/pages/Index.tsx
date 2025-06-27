
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Check for recovery flow parameters at root URL
    const code = searchParams.get('code');
    const type = searchParams.get('type');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    // If we have recovery parameters, redirect to auth callback
    if (code || (accessToken && refreshToken) || type === 'recovery') {
      console.log("Index: Recovery parameters detected, redirecting to auth callback");
      const currentUrl = window.location.href;
      const redirectUrl = currentUrl.replace(window.location.origin, window.location.origin + '/auth/callback');
      window.location.replace(redirectUrl);
      return;
    }
    
    // Check if we're in a recovery flow - if so, don't redirect
    const currentUrl = window.location.href;
    const isRecoveryFlow = 
      currentUrl.includes('type=recovery') ||
      currentUrl.includes('recovery') ||
      window.location.pathname === '/reset-password' ||
      window.location.pathname === '/auth/callback';
      
    if (isRecoveryFlow) {
      console.log("Index: Recovery flow detected, skipping auto-redirect");
      return;
    }
    
    if (!loading && user) {
      navigate("/home", { replace: true });
    }
  }, [user, loading, navigate, searchParams]);

  // If still loading within the 3-second window, show spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If no user is found after loading, show login/signup options
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to FanRealms</h1>
        <div className="flex gap-4">
          <Button asChild>
            <Link to="/signup">Sign Up</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">Log In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // This shouldn't be rendered as the useEffect will redirect
  return null;
};

export default Index;
