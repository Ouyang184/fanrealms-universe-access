
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
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
  }, [user, loading, navigate]);

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
