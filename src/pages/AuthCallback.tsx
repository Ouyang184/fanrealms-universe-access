import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sanitizeReturnTo } from "@/utils/auth-redirects";
import { clearStoredOAuthReturnTo, getStoredOAuthReturnTo, getStoredOAuthIntent, clearStoredOAuthIntent } from "@/utils/oauth-storage";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handled = useRef(false);
  const [callbackError, setCallbackError] = useState<string | null>(null);

  const returnTo = sanitizeReturnTo(
    searchParams.get('returnTo'),
    getStoredOAuthReturnTo('/marketplace')
  );
  const flow = searchParams.get('flow');
  const isSignupConfirmation =
    flow === 'signup' ||
    searchParams.get('type') === 'signup' ||
    searchParams.get('type') === 'email_change';
  const loadingTitle = isSignupConfirmation ? 'Confirming your email…' : 'Signing you in…';
  const loadingDescription = isSignupConfirmation ? 'Activating your account.' : 'Just a moment.';

  // Read OAuth intent up-front so error UI knows which page to send the user back to.
  const queryIntent = searchParams.get('intent');
  const initialIntent: 'login' | 'signup' | null =
    queryIntent === 'login' || queryIntent === 'signup'
      ? queryIntent
      : (typeof window !== 'undefined' ? getStoredOAuthIntent() : null);
  const [intentState] = useState<'login' | 'signup' | null>(initialIntent);
  const errorBackPath = intentState === 'signup' ? '/signup' : '/login';
  const errorBackLabel = intentState === 'signup' ? 'Back to sign up' : 'Back to login';

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    // Password reset flow
    const isRecovery =
      searchParams.get('type') === 'recovery' ||
      hashParams.get('type') === 'recovery';
    if (isRecovery) {
      navigate('/reset-password', { replace: true });
      return;
    }

    // Surface OAuth provider errors immediately, with intent-aware messaging.
    const oauthError = searchParams.get('error') || hashParams.get('error');
    const oauthErrorDesc =
      searchParams.get('error_description') || hashParams.get('error_description');
    if (oauthError) {
      console.error('[AUTH][Callback] Provider error', { oauthError, oauthErrorDesc, intent: intentState });
      const rawMessage = oauthErrorDesc || oauthError;
      const looksLikeMissingUser = /user not found|no.?account|signups? not allowed/i.test(rawMessage);
      const message = intentState === 'signup' && looksLikeMissingUser
        ? "We couldn't create your account from Google. Please try again, or sign up with email below."
        : rawMessage;
      setCallbackError(message);
      const title = intentState === 'signup' ? 'Sign-up failed' : 'Sign in failed';
      toast.error(title, { description: message });
      return;
    }

    const intent = intentState;

    const finish = (target: string) => {
      clearStoredOAuthReturnTo();
      clearStoredOAuthIntent();
      // Hard navigate so the next page boots with the session committed.
      window.location.replace(target);
    };

    const handleSession = async (session: any) => {
      // If we have an OAuth intent, validate it before committing the session.
      if (intent) {
        try {
          const { data, error } = await supabase.functions.invoke('oauth-intent-validate', {
            body: { intent },
          });
          if (error) {
            console.error('[AUTH][Callback] validator error', error);
            // Fail open — let the user in rather than blocking on infra issues.
          } else if (data?.error === 'account_exists') {
            // Signed up but account already existed -> sign out, redirect to login.
            await supabase.auth.signOut();
            clearStoredOAuthIntent();
            const message = 'An account already exists for this Google address. Please log in instead.';
            setCallbackError(message);
            toast.error('Account already exists', { description: message });
            setTimeout(() => navigate('/login', { replace: true }), 2500);
            return;
          } else if (data?.error === 'no_account') {
            // Tried to log in with a brand-new Google account -> account was deleted by the function.
            await supabase.auth.signOut();
            clearStoredOAuthIntent();
            const message = "No account found for this Google address. Please sign up first.";
            setCallbackError(message);
            toast.error('No account found', { description: message });
            setTimeout(() => navigate('/signup', { replace: true }), 2500);
            return;
          }
        } catch (e) {
          console.error('[AUTH][Callback] validator exception', e);
          // Fail open
        }
      }

      finish(returnTo);
    };

    // Strategy: rely on the Supabase SDK (detectSessionInUrl=true) to perform
    // the PKCE exchange. Listen for SIGNED_IN, and as a fallback poll
    // getSession() — never call exchangeCodeForSession ourselves.
    let resolved = false;
    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      if (resolved) return;
      console.log('[AUTH][Callback] onAuthStateChange', { event, hasSession: !!session });
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        resolved = true;
        handleSession(session);
      }
    }).data.subscription;

    const started = Date.now();
    const TIMEOUT_MS = 10000;
    const interval = window.setInterval(async () => {
      if (resolved) {
        window.clearInterval(interval);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        resolved = true;
        window.clearInterval(interval);
        handleSession(data.session);
        return;
      }
      if (Date.now() - started > TIMEOUT_MS) {
        window.clearInterval(interval);
        if (resolved) return;
        resolved = true;
        console.warn('[AUTH][Callback] No session after timeout', { intent: intentState });
        if (isSignupConfirmation) {
          navigate('/login', { replace: true });
        } else if (intentState === 'signup') {
          toast.error('Sign up failed', { description: 'Please try again.' });
          navigate('/signup', { replace: true });
        } else {
          toast.error('Sign in failed', { description: 'Please try again.' });
          navigate('/login', { replace: true });
        }
      }
    }, 250);

    return () => {
      subscription.unsubscribe();
      window.clearInterval(interval);
    };
  }, [navigate, searchParams, returnTo, isSignupConfirmation, intentState]);

  if (callbackError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h2 className="text-xl font-medium">{intentState === 'signup' ? 'Sign-up issue' : 'Sign-in issue'}</h2>
          <p className="text-sm text-muted-foreground">{callbackError}</p>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate(errorBackPath, { replace: true })}
          >
            {errorBackLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-4" />
        <h2 className="text-xl font-medium mb-2">{loadingTitle}</h2>
        <p className="text-muted-foreground">{loadingDescription}</p>
      </div>
    </div>
  );
};

export default AuthCallback;
