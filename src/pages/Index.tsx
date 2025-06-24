
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
    if (!loading && user) {
      navigate("/home", { replace: true });
    }
  }, [user, loading, navigate]);

  // If still loading, show spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  // If no user is found after loading, show landing page
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-900 text-white">
        <h1 className="text-4xl font-bold mb-8">Welcome to FanRealms</h1>
        <div className="flex gap-4">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link to="/signup">Sign Up</Link>
          </Button>
          <Button asChild variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
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
