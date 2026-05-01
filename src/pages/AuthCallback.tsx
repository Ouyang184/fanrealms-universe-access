import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeReturnTo } from "@/utils/auth-redirects";
import { clearStoredOAuthReturnTo, getStoredOAuthReturnTo } from "@/utils/oauth-storage";

// Module-level promise: ensures only ONE exchangeCodeForSession runs per
// code, even across StrictMode double-mounts within the same tab.
const inflightExchanges = new Map<string, Promise<boolean>>();

const waitForSession = async (timeoutMs = 8000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return data.session;
    await new Promise((resolve) => window.setTimeout(resolve, 200));
  }
  return null;
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const handled = useRef(false);

  const returnTo = sanitizeReturnTo(searchParams.get('returnTo'), getStoredOAuthReturnTo('/dashboard'));
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

    // Surface OAuth provider errors
    const oauthError = searchParams.get('error') || hashParams.get('error');
    const oauthErrorDesc =
      searchParams.get('error_description') || hashParams.get('error_description');
    if (oauthError) {
      console.error('[AUTH][Callback] Provider error', { oauthError, oauthErrorDesc });
      toast({
        title: 'Sign in failed',
        description: oauthErrorDesc || oauthError,
        variant: 'destructive',
      });
      navigate('/login', { replace: true });
      return;
    }

    const finish = (target: string) => {
      clearStoredOAuthReturnTo();
      // Hard navigate so the next page boots with the session already
      // committed to localStorage and AuthContext re-initialises cleanly.
      window.location.replace(target);
    };

    const runExchange = async (code: string): Promise<boolean> => {
      // De-dupe across StrictMode double-mounts in the same tab.
      const existing = inflightExchanges.get(code);
      if (existing) {
        console.log('[AUTH][Callback] Joining in-flight exchange for code');
        return existing;
      }

      const promise = (async () => {
        // Maybe a previous attempt already produced a session.
        const { data: pre } = await supabase.auth.getSession();
        if (pre.session?.user) {
          console.log('[AUTH][Callback] Session already present before exchange');
          return true;
        }

        console.log('[AUTH][Callback] Calling exchangeCodeForSession');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (data?.session?.user) {
          console.log('[AUTH][Callback] Exchange succeeded', { userId: data.session.user.id });
          return true;
        }

        if (error) {
          console.warn('[AUTH][Callback] Exchange returned error, polling for session', {
            message: error.message,
          });
          // The exchange may have actually succeeded on another mount/tab —
          // give Supabase a moment to surface the session.
          const session = await waitForSession(3000);
          return !!session?.user;
        }

        // No error, no session — keep polling briefly just in case.
        const session = await waitForSession(2000);
        return !!session?.user;
      })();

      inflightExchanges.set(code, promise);
      try {
        return await promise;
      } finally {
        // Keep the resolved value around for a moment so duplicate mounts
        // observe the same outcome instead of starting a new exchange.
        window.setTimeout(() => inflightExchanges.delete(code), 5000);
      }
    };

    const redirectToLogin = (reason: string) => {
      console.warn('[AUTH][Callback] Redirecting to login', { reason });
      navigate('/login', { replace: true });
    };

    const go = async () => {
      try {
        const code = searchParams.get('code');

        if (code) {
          const ok = await runExchange(code);
          if (ok) {
            toast({ title: 'Signed in successfully!' });
            finish(returnTo);
            return;
          }

          // Last-chance check: maybe another tab / earlier attempt logged us in.
          const fallback = await waitForSession(2000);
          if (fallback?.user) {
            finish(returnTo);
            return;
          }

          toast({
            title: 'Sign in failed',
            description: 'Could not complete the sign-in. Please try again.',
            variant: 'destructive',
          });
          redirectToLogin('code exchange failed');
          return;
        }

        // Implicit flow / existing session fallback (no ?code= in URL)
        const { data: existing } = await supabase.auth.getSession();
        if (existing.session?.user) {
          toast({ title: 'Signed in successfully!' });
          finish(returnTo);
          return;
        }

        // Sometimes the session hasn't been persisted by the time we land here.
        const polled = await waitForSession(3000);
        if (polled?.user) {
          finish(returnTo);
          return;
        }

        toast({
          title: isSignupConfirmation ? 'Email confirmed' : 'Sign in failed',
          description: isSignupConfirmation
            ? 'Your account is active. Please sign in.'
            : 'Please try again.',
          variant: isSignupConfirmation ? 'default' : 'destructive',
        });
        redirectToLogin('no code or existing session found');
      } catch (err: any) {
        console.error('[AUTH][Callback] Unexpected error', err);
        // One more chance — maybe a session showed up despite the error.
        const session = await waitForSession(2000);
        if (session?.user) {
          finish(returnTo);
          return;
        }
        toast({
          title: isSignupConfirmation ? 'Confirmation failed' : 'Sign in failed',
          description: err?.message || 'Please try again.',
          variant: 'destructive',
        });
        navigate('/login', { replace: true });
      }
    };

    go();
  }, [navigate, searchParams, toast, returnTo, isSignupConfirmation]);

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
