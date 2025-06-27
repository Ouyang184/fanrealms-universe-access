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
    
    // If we have recovery parameters, redirect DIRECTLY to reset-password
    if (code || (accessToken && refreshToken) || type === 'recovery') {
      console.log("Index: Recovery parameters detected, redirecting to reset-password");
      console.log("Index: Parameters found:", { code, type, accessToken: !!accessToken, refreshToken: !!refreshToken });
      
      // Pass all parameters to reset-password page
      const currentParams = window.location.search;
      const currentHash = window.location.hash;
      const redirectUrl = `/reset-password${currentParams}${currentHash}`;
      
      console.log("Index: Redirecting to:", redirectUrl);
      window.location.replace(redirectUrl);
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
