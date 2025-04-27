
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireCompleteProfile?: boolean;
}

const AuthGuard = ({ 
  children, 
  requireAuth = true,
  requireCompleteProfile = true
}: AuthGuardProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!user && requireAuth) {
      const returnTo = location.pathname + location.search;
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    if (user && !profile?.profile_completed && requireCompleteProfile && window.location.pathname !== "/complete-profile") {
      navigate("/complete-profile");
      return;
    }
  }, [user, profile, loading, navigate, location, requireAuth, requireCompleteProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
