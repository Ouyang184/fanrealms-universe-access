
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    const run = async () => {
      // If no user in context but a session might still be in storage from a
      // just-completed OAuth callback, double-check before bouncing to /login.
      if (requireAuth && !user) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!data.session?.user) {
          const returnTo = location.pathname + location.search;
          navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
          return;
        }
        // Session exists; AuthContext.onAuthStateChange will populate `user`
        // shortly. Wait one more render — don't redirect.
        return;
      }

      if (user && ['/login', '/signup'].includes(location.pathname)) {
        navigate('/dashboard');
        return;
      }

      setHasCheckedAuth(true);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user, profile, loading, navigate, location, requireAuth, requireCompleteProfile]);

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
