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
  "/payment",
  "/payment-success",
  "/purchase-success",
  "/subscriptions",
  "/commissions",
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

  // Authed user on /login or /signup → honor returnTo if present, else /library.
  if (hasUser && isAuthPath(pathname) && pathname !== "/complete-profile") {
    const returnTo = new URLSearchParams(search).get("returnTo") || "/marketplace";
    return isComplete ? returnTo : resolveCompletionRoute(false, returnTo);
  }

  // Authed user on /complete-profile but already complete → honor returnTo.
  if (hasUser && isComplete && pathname === "/complete-profile") {
    const returnTo = new URLSearchParams(search).get("returnTo") || "/marketplace";
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
  const signupSignOutInFlightRef = useRef(false);
  useEffect(() => {
    const onSignup =
      location.pathname === "/signup" || location.pathname.startsWith("/signup/");
    if (!onSignup) {
      signedOutForSignupRef.current = false;
      signupSignOutInFlightRef.current = false;
      return;
    }
    // Only sign out when THIS tab is the one the user is actively on. A
    // logged-in session is mirrored across tabs by Supabase, so a stale
    // /signup tab left open from a prior "check your email" step would
    // otherwise receive the SIGNED_IN event the instant the user logs in
    // in ANOTHER tab — and then this effect would fire a global signOut(),
    // killing the session they just created (login succeeds, then is
    // immediately revoked, bouncing them back to /login). Guarding on
    // visible+focused means a backgrounded /signup tab no longer self-
    // destructs the session; AuthGate's decideTarget simply redirects it
    // to /marketplace instead. The deliberate "I'm logged in and clicked
    // Sign up to make a new account" flow still works because that tab is
    // the focused one.
    const activelyOnSignupTab =
      typeof document === "undefined" ||
      (document.visibilityState === "visible" && document.hasFocus());

    if (
      authReady &&
      user &&
      !signingOut &&
      activelyOnSignupTab &&
      !signedOutForSignupRef.current &&
      !signupSignOutInFlightRef.current
    ) {
      signedOutForSignupRef.current = true;
      signupSignOutInFlightRef.current = true;
      // signOut() navigates to /login when it resolves; immediately bounce
      // back to /signup so the user lands on the page they asked for.
      void signOut()
        .then(() => navigate("/signup", { replace: true }))
        .finally(() => {
          signupSignOutInFlightRef.current = false;
        });
    }
  }, [location.pathname, authReady, user, signingOut, signOut, navigate]);

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
  const MAX_REDIRECTS_PER_KEY = 1;
  const transitionKeyRef = useRef<string | null>(null);
  const dispatchCountRef = useRef(0);
  const lastDispatchedTargetRef = useRef<string | null>(null);
  const transitionKey = [
    user?.id ?? "anon",
    isProfileComplete ? "complete" : "incomplete",
    location.pathname + location.search,
  ].join("|");

  // Reset per-key counters whenever the transition key changes.
  if (transitionKeyRef.current !== transitionKey) {
    transitionKeyRef.current = transitionKey;
    dispatchCountRef.current = 0;
    lastDispatchedTargetRef.current = null;
  }

  // Memoize the redirect decision so it only recomputes when the inputs
  // that actually drive it change. Used by both the effect and the
  // pre-render flash guard so they stay perfectly in sync.
  const pendingTarget = useMemo(
    () =>
      decideTarget({
        hasUser: !!user,
        isComplete: isProfileComplete,
        pathname: location.pathname,
        search: location.search,
      }),
    [user, isProfileComplete, location.pathname, location.search]
  );

  useEffect(() => {
    if (blocked) return;
    if (dispatchCountRef.current >= MAX_REDIRECTS_PER_KEY) return;
    if (!pendingTarget) return;
    if (pendingTarget === location.pathname + location.search) return;
    if (lastDispatchedTargetRef.current === pendingTarget) return;
    lastDispatchedTargetRef.current = pendingTarget;
    dispatchCountRef.current += 1;
    navigate(pendingTarget, { replace: true });
  }, [blocked, pendingTarget, location.pathname, location.search, navigate]);

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
  // the user never sees a flash of the wrong page. Reuses the memoized
  // decision from above so the effect and this guard never disagree.
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
