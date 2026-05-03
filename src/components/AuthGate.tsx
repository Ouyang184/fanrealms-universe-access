import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Shared loading gate. Renders a single full-screen spinner until the
 * AuthContext has finished restoring the persisted session (initial
 * `getSession()` + first `onAuthStateChange` event).
 *
 * Mounting this once above the router guarantees that route guards
 * (`AuthGuard`, `useAuthCheck`, page-level checks) never see an
 * indeterminate `loading=true` state and therefore never flash an
 * intermediate UI — empty layout, public landing, or a login redirect —
 * before auth is known.
 *
 * Additionally, for auth-sensitive routes (/login, /signup,
 * /complete-profile, /dashboard*) we hold rendering until `authReady`
 * (initial getSession + first onAuthStateChange both observed) so these
 * pages never paint with an unverified session.
 */
const AUTH_SENSITIVE_PREFIXES = [
  "/login",
  "/signup",
  "/complete-profile",
  "/dashboard",
];

const isAuthSensitive = (pathname: string) =>
  AUTH_SENSITIVE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { loading, authReady } = useAuth();
  const location = useLocation();

  const sensitive = isAuthSensitive(location.pathname);
  const blocked = loading || (sensitive && !authReady);

  if (blocked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <LoadingSpinner />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGate;
