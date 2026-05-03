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
 *
 * This split eliminates the duplicate-redirect / infinite-reload class
 * of bugs: only one component ever calls navigate() for auth reasons.
 */
const AuthGuard = ({
  children,
  requireAuth = true,
  requireCompleteProfile = true,
}: AuthGuardProps) => {
  const { user, loading, signingOut, isProfileComplete } = useAuth();

  // While auth is restoring or a sign-out is in flight, never render
  // protected children — even for one frame — so authed UI cannot flash
  // before the global gate redirects to /login.
  if (loading || signingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Conditions failing → AuthGate is about to (or has already) redirected.
  // Show a spinner instead of the protected content in the meantime.
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (requireCompleteProfile && user && !isProfileComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
