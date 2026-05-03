
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
  const { user, profile, loading, signingOut, isProfileComplete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  // Session restoration is handled centrally by AuthContext.

  // Loop-prevention: a redirect "transition" is a unique combination of
  // (auth state × current path). Within a single transition we permit AT
  // MOST ONE navigation; the next render with the same transition key
  // becomes a no-op even if the effect re-runs. The budget is a final
  // hard stop in case transitions churn unexpectedly.
  const lastNavRef = useRef<string | null>(null);
  const transitionKeyRef = useRef<string | null>(null);
  const navigatedThisTransitionRef = useRef(false);
  const redirectCountRef = useRef(0);
  const MAX_REDIRECTS = 3;

  // Compose a transition key from the inputs that should reset the
  // "already navigated" latch. Auth identity, profile completeness,
  // sign-out flag, and the path the user is currently on.
  const transitionKey = [
    user?.id ?? 'anon',
    isProfileComplete ? 'complete' : 'incomplete',
    signingOut ? 'signing-out' : 'stable',
    location.pathname + location.search,
  ].join('|');

  if (transitionKeyRef.current !== transitionKey) {
    transitionKeyRef.current = transitionKey;
    navigatedThisTransitionRef.current = false;
  }

  const safeNavigate = (target: string) => {
    if (navigatedThisTransitionRef.current) {
      // Already redirected once for this auth transition — refuse to
      // navigate again until inputs change. Prevents infinite reload loops.
      setHasCheckedAuth(true);
      return false;
    }
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
    navigatedThisTransitionRef.current = true;
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

      // No user — AuthContext has already restored the session via getSession()
      // at startup, so trust it here instead of re-querying on every navigation.
      if (requireAuth && !user) {
        if (isAuthPath(location.pathname)) {
          setHasCheckedAuth(true);
          return;
        }
        const loginUrl = buildLoginUrl(location.pathname, location.search);
        safeNavigate(loginUrl);
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

  // While a sign-out is in flight we must NEVER render protected children
  // again — even for one frame — or the user will see authed UI flash
  // before the redirect to /login lands.
  if (loading || signingOut || !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
