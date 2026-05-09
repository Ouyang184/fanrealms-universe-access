import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireCompleteProfile?: boolean;
}

/**
 * Per-route access gate. Blocks children from rendering until the
 * required auth/profile conditions hold for THIS route. It does NOT
 * navigate — the global AuthGate (mounted once above the router) is
 * the single source of truth for "where should the user be?" and
 * dispatches at most one redirect per auth-state × path transition.
 */
const AuthGuard = ({
  children,
  requireAuth = true,
  requireCompleteProfile = true,
}: AuthGuardProps) => {
  const { user, loading, signingOut, isProfileComplete, profileLoading } = useAuth();

  const showSpinner =
    loading ||
    signingOut ||
    (requireAuth && !user) ||
    (requireAuth && !!user && profileLoading) ||
    (requireCompleteProfile && user && !isProfileComplete);

  if (showSpinner) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <LoadingSpinner />
        <p className="text-sm text-muted-foreground">Verifying your session…</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
