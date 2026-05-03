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
 */
const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { loading } = useAuth();

  if (loading) {
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
