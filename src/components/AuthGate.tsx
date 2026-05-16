import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
import { buildLoginUrl, isAuthPath } from "@/utils/auth-redirects";
import { resolveCompletionRoute } from "@/lib/auth/profileCompletion";

/**
 * Single global gate that:
 *   1. Blocks rendering until AuthContext has restored the session
 *      (initial getSession() + first onAuthStateChange both observed
 *      via `authReady` for sensitive routes; `loading` for everything
 *      else).
 *   2. Decides — exactly once per (auth-state × path) transition — where
 *      the user should be (login / dashboard / complete-profile / stay)
 *      and dispatches at most ONE navigation.
 *
 * Centralizing both jobs here means individual pages and route guards
 * never run their own getSession() or auth-redirect effects, which is
 * what used to cause duplicate redirects and infinite reloads.
 *
 * AuthGuard now only enforces "must be signed in / must have complete
 * profile" for a specific protected route by blocking children until
 * those conditions hold; it relies on this gate to actually navigate.
 */

// Routes that depend on auth state. AuthGate watches these and, the
// instant `user` flips to null (sign-out in this tab OR cross-tab via
// the SIGNED_OUT listener in AuthContext), redirects to /login. Keep
// in sync with the <AuthGuard> wrapped routes in App.tsx.
const AUTH_SENSITIVE_PREFIXES = [
  "/login",
  "/signup",
  "/complete-profile",
  "/dashboard",
  "/settings",
  "/library",
];

const isAuthSensitive = (pathname: string) =>
  AUTH_SENSITIVE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

/**
 * Pure function: given the current auth state and location, return the
 * path the user SHOULD be on, or null if the current location is fine.
 * Keeping this pure (no navigation, no refs) makes the redirect rule
 * trivial to reason about and test.
 */
const decideTarget = (params: {
  hasUser: boolean;
  isComplete: boolean;
  pathname: string;
  search: string;
}): string | null => {
  const { hasUser, isComplete, pathname, search } = params;
  const here = pathname + search;

  // Unauthed user on a protected route → /login?returnTo=…
  if (!hasUser && isAuthSensitive(pathname) && !isAuthPath(pathname)) {
    return buildLoginUrl(pathname, search);
  }

  // Authed user on /login or /signup → straight to correct destination.
  if (hasUser && isAuthPath(pathname) && pathname !== "/complete-profile") {
    return isComplete ? "/dashboard" : resolveCompletionRoute(false, "/dashboard");
  }

  // Authed user on /complete-profile but already complete → honor returnTo.
  if (hasUser && isComplete && pathname === "/complete-profile") {
    const returnTo = new URLSearchParams(search).get("returnTo") || "/dashboard";
    return returnTo === here ? null : returnTo;
  }

  // Authed user with incomplete profile on a sensitive non-auth route
  // (/dashboard*, /settings*) → /complete-profile?returnTo=…
  if (
    hasUser &&
    !isComplete &&
    isAuthSensitive(pathname) &&
    pathname !== "/complete-profile" &&
    !isAuthPath(pathname)
  ) {
    return resolveCompletionRoute(false, here);
  }

  return null;
};

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { loading, authReady, user, isProfileComplete, signingOut, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // If an already-signed-in user navigates to /signup, sign them out so
  // they can actually create a new account. Without this, AuthGate would
  // bounce them straight to /dashboard on their existing account, which
  // looks like "signup logged me in as someone else".
  const signedOutForSignupRef = useRef(false);
  useEffect(() => {
    const onSignup =
      location.pathname === "/signup" || location.pathname.startsWith("/signup/");
    if (!onSignup) {
      signedOutForSignupRef.current = false;
      return;
    }
    if (authReady && user && !signingOut && !signedOutForSignupRef.current) {
      signedOutForSignupRef.current = true;
      // signOut() navigates to /login when it resolves; immediately bounce
      // back to /signup so the user lands on the page they asked for.
      void signOut().then(() => navigate("/signup", { replace: true }));
    }
  }, [location.pathname, authReady, user, signingOut, signOut]);

  const sensitive = isAuthSensitive(location.pathname);
  // Block only for session restoration/sign-out. Profile fetches happen in
  // the background so tab/app switching doesn't replace the current screen
  // with the verification spinner.
  const blocked =
    signingOut ||
    (sensitive && (loading || !authReady));

  // Loop-prevention: a "transition" is a unique combination of inputs
  // that drive the redirect decision. Within a single transition we
  // dispatch AT MOST ONE navigation. The next render with the same key
  // is a no-op even if React re-runs the effect.
  const transitionKeyRef = useRef<string | null>(null);
  const transitionKey = [
    user?.id ?? "anon",
    isProfileComplete ? "complete" : "incomplete",
    location.pathname + location.search,
  ].join("|");

  useEffect(() => {
    if (blocked) return;
    if (transitionKeyRef.current === transitionKey) return;
    transitionKeyRef.current = transitionKey;

    const target = decideTarget({
      hasUser: !!user,
      isComplete: isProfileComplete,
      pathname: location.pathname,
      search: location.search,
    });
    if (!target) return;
    if (target === location.pathname + location.search) return;
    navigate(target, { replace: true });
  }, [
    blocked,
    transitionKey,
    user,
    isProfileComplete,
    location.pathname,
    location.search,
    navigate,
  ]);

  if (blocked) {
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

  // If we're going to navigate this tick, hide stale UI for one frame so
  // the user never sees a flash of the wrong page.
  const pendingTarget = decideTarget({
    hasUser: !!user,
    isComplete: isProfileComplete,
    pathname: location.pathname,
    search: location.search,
  });
  if (pendingTarget && pendingTarget !== location.pathname + location.search) {
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

export default AuthGate;
