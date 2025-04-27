
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";

// This page acts as a redirector
const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // After auth state is determined, redirect to appropriate page
    if (!loading) {
      navigate(user ? "/dashboard" : "/home");
    }
  }, [user, loading, navigate]);

  // Show loading state while determining auth status
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
};

export default Index;
