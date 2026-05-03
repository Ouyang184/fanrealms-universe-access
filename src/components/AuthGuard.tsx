
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
import { buildLoginUrl, isAuthPath } from "@/utils/auth-redirects";

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
  const { user, profile, loading, isProfileComplete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [sessionRestorePending, setSessionRestorePending] = useState(false);

  // Loop-prevention: remember the last destination we navigated to from this
  // guard so we never bounce to the same place twice in a row, and bail out
  // entirely if we exceed a small redirect budget.
  const lastNavRef = useRef<string | null>(null);
  const redirectCountRef = useRef(0);
  const MAX_REDIRECTS = 3;

  const safeNavigate = (target: string) => {
    if (redirectCountRef.current >= MAX_REDIRECTS) {
      console.warn('[AuthGuard] Redirect budget exceeded, refusing to navigate', {
        target,
        from: location.pathname,
      });
      setHasCheckedAuth(true);
      return false;
    }
    const currentFull = location.pathname + location.search;
    if (target === currentFull || target === lastNavRef.current) {
      // Already there (or just sent there) — don't loop.
      setHasCheckedAuth(true);
      return false;
    }
    lastNavRef.current = target;
    redirectCountRef.current += 1;
    navigate(target, { replace: true });
    return true;
  };

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    setHasCheckedAuth(false);

    const run = async () => {
      // Authenticated user landing on an auth page → skip to dashboard or complete-profile.
      if (user && isAuthPath(location.pathname)) {
        if (location.pathname !== '/dashboard') {
          safeNavigate('/dashboard');
        } else {
          setHasCheckedAuth(true);
        }
        return;
      }

      // No user in context — double-check storage before bouncing to /login.
      if (requireAuth && !user) {
        if (isAuthPath(location.pathname)) {
          setHasCheckedAuth(true);
          return;
        }

        setSessionRestorePending(true);
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;
        setSessionRestorePending(false);

        if (error || !data.session?.user) {
          const loginUrl = buildLoginUrl(location.pathname, location.search);
          safeNavigate(loginUrl);
          return;
        }
        setHasCheckedAuth(true);
        return;
      }

      // Authenticated user with incomplete profile → redirect to /complete-profile.
      // Only runs when requireCompleteProfile is true and we are NOT already there.
      if (
        requireCompleteProfile &&
        user &&
        !isProfileComplete &&
        location.pathname !== '/complete-profile'
      ) {
        const returnTo = encodeURIComponent(location.pathname + location.search);
        safeNavigate(`/complete-profile?returnTo=${returnTo}`);
        return;
      }

      setHasCheckedAuth(true);
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, loading, location.pathname, location.search, requireAuth, requireCompleteProfile]);

  if (loading || sessionRestorePending || !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
