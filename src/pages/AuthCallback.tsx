import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sanitizeReturnTo } from "@/utils/auth-redirects";
import { clearStoredOAuthReturnTo, getStoredOAuthReturnTo } from "@/utils/oauth-storage";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handled = useRef(false);
  const [callbackError, setCallbackError] = useState<string | null>(null);

  const returnTo = sanitizeReturnTo(
    searchParams.get('returnTo'),
    getStoredOAuthReturnTo('/dashboard')
  );
  const flow = searchParams.get('flow');
  const isSignupConfirmation =
    flow === 'signup' ||
    searchParams.get('type') === 'signup' ||
    searchParams.get('type') === 'email_change';
  const loadingTitle = isSignupConfirmation ? 'Confirming your email…' : 'Signing you in…';
  const loadingDescription = isSignupConfirmation ? 'Activating your account.' : 'Just a moment.';

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

    // Surface OAuth provider errors immediately
    const oauthError = searchParams.get('error') || hashParams.get('error');
    const oauthErrorDesc =
      searchParams.get('error_description') || hashParams.get('error_description');
    if (oauthError) {
      console.error('[AUTH][Callback] Provider error', { oauthError, oauthErrorDesc });
      const message = oauthErrorDesc || oauthError;
      setCallbackError(message);
      toast.error('Sign in failed', { description: message });
      return;
    }

    const finish = (target: string) => {
      clearStoredOAuthReturnTo();
      // Hard navigate so the next page boots with the session committed.
      window.location.replace(target);
    };

    // Strategy: rely on the Supabase SDK (detectSessionInUrl=true) to perform
    // the PKCE exchange. Listen for SIGNED_IN, and as a fallback poll
    // getSession() — never call exchangeCodeForSession ourselves, because the
    // SDK has already consumed the one-time PKCE code by the time we mount.
    let resolved = false;
    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      if (resolved) return;
      console.log('[AUTH][Callback] onAuthStateChange', { event, hasSession: !!session });
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        resolved = true;
        toast.success('Signed in successfully!');
        finish(returnTo);
      }
    }).data.subscription;

    // Poll as a safety net (covers cases where the SDK already had a session
    // and never re-fires the event after we mount the listener).
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
        toast.success('Signed in successfully!');
        finish(returnTo);
        return;
      }
      if (Date.now() - started > TIMEOUT_MS) {
        window.clearInterval(interval);
        if (resolved) return;
        resolved = true;
        console.warn('[AUTH][Callback] No session after timeout, redirecting to login');
        if (isSignupConfirmation) {
          toast.success('Email confirmed', { description: 'Your account is active. Please sign in.' });
        } else {
          toast.error('Sign in failed', { description: 'Please try again.' });
        }
        navigate('/login', { replace: true });
      }
    }, 250);

    return () => {
      subscription.unsubscribe();
      window.clearInterval(interval);
    };
  }, [navigate, searchParams, returnTo, isSignupConfirmation]);

  if (callbackError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h2 className="text-xl font-medium">Google sign-in failed</h2>
          <p className="text-sm text-muted-foreground">{callbackError}</p>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate('/login', { replace: true })}
          >
            Back to login
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
