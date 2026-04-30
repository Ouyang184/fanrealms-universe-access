import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const PKCE_KEYS = [
  'supabase.auth.token-code-verifier',
  'sb-eaeqyctjljbtcatlohky-auth-token-code-verifier',
];

const inspectPkceStorage = () => {
  try {
    const all: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.includes('code-verifier') || k.includes('auth-token') || k.startsWith('sb-')) {
        const v = localStorage.getItem(k);
        all[k] = v ? `${v.substring(0, 12)}…(len=${v.length})` : null;
      }
    }
    const explicit: Record<string, boolean> = {};
    PKCE_KEYS.forEach((k) => (explicit[k] = !!localStorage.getItem(k)));
    return { explicit, matchedKeys: all };
  } catch (e: any) {
    return { error: e?.message };
  }
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const handled = useRef(false);
  const navigated = useRef(false);

  const returnTo = searchParams.get('returnTo') || '/dashboard';
  const flow = searchParams.get('flow');
  const isSignupConfirmation = flow === 'signup' || searchParams.get('type') === 'signup' || searchParams.get('type') === 'email_change';
  const loadingTitle = isSignupConfirmation ? 'Confirming your email…' : 'Signing you in…';
  const loadingDescription = isSignupConfirmation ? 'Activating your account.' : 'Just a moment.';

  // Once AuthContext confirms the user is set, redirect.
  useEffect(() => {
    console.log('[AUTH][Callback] AuthContext state', {
      loading,
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      returnTo,
      flow,
      isSignupConfirmation,
      navigated: navigated.current,
    });
    if (!loading && user && !navigated.current) {
      navigated.current = true;
      console.log('[AUTH][Callback] User confirmed, navigating to', returnTo);
      navigate(returnTo, { replace: true });
    }
  }, [user, loading, navigate, returnTo]);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const currentUrl = window.location.href;
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const allSearchKeys: Record<string, string> = {};
    searchParams.forEach((v, k) => (allSearchKeys[k] = v.length > 24 ? `${v.substring(0, 24)}…` : v));
    const allHashKeys: Record<string, string> = {};
    hashParams.forEach((v, k) => (allHashKeys[k] = v.length > 24 ? `${v.substring(0, 24)}…` : v));

    console.log('[AUTH][Callback] Mounted', {
      currentUrl,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      flow,
      isSignupConfirmation,
      searchKeys: allSearchKeys,
      hashKeys: allHashKeys,
      pkceStorage: inspectPkceStorage(),
      timestamp: new Date().toISOString(),
    });

    // Password reset flow
    const isRecovery =
      searchParams.get('type') === 'recovery' ||
      hashParams.get('type') === 'recovery' ||
      currentUrl.includes('type=recovery');

    if (isRecovery) {
      console.log('[AUTH][Callback] Detected recovery flow, redirecting to /reset-password');
      navigate('/reset-password', { replace: true });
      return;
    }

    // Surface OAuth provider errors
    const oauthError = searchParams.get('error') || hashParams.get('error');
    const oauthErrorDesc = searchParams.get('error_description') || hashParams.get('error_description');
    if (oauthError) {
      console.error('[AUTH][Callback] OAuth provider returned error', { oauthError, oauthErrorDesc });
    }

    const go = async () => {
      try {
        // PKCE code exchange
        const code = searchParams.get('code');
        console.log('[AUTH][Callback] PKCE code present?', { hasCode: !!code, codePreview: code?.substring(0, 12) });

        if (code) {
          console.log('[AUTH][Callback] Calling exchangeCodeForSession…');
          const t0 = performance.now();
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          const dt = Math.round(performance.now() - t0);
          console.log('[AUTH][Callback] exchangeCodeForSession result', {
            durationMs: dt,
            hasSession: !!data?.session,
            hasUser: !!data?.session?.user,
            userId: data?.session?.user?.id,
            email: data?.session?.user?.email,
            error: error?.message,
            errorStatus: (error as any)?.status,
            pkceStorageAfter: inspectPkceStorage(),
          });
          if (!error && data.session?.user) {
            toast({ title: "Signed in successfully!" });
            return; // first useEffect handles navigation
          }
          console.warn('[AUTH][Callback] code exchange failed', error?.message);
        }

        // Implicit flow / existing session fallback
        console.log('[AUTH][Callback] Checking for existing session via getSession()…');
        const { data: existing, error: existingErr } = await supabase.auth.getSession();
        console.log('[AUTH][Callback] getSession() result', {
          hasSession: !!existing.session,
          userId: existing.session?.user?.id,
          email: existing.session?.user?.email,
          error: existingErr?.message,
        });
        if (existing.session?.user) {
          toast({ title: "Signed in successfully!" });
          return;
        }

        // Wait briefly for onAuthStateChange
        console.log('[AUTH][Callback] No session yet, listening for onAuthStateChange (5s)…');
        await new Promise<void>((resolve) => {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[AUTH][Callback] onAuthStateChange fired', {
              event,
              hasSession: !!session,
              userId: session?.user?.id,
            });
            if (event === 'SIGNED_IN' && session?.user) {
              subscription.unsubscribe();
              toast({ title: "Signed in successfully!" });
              resolve();
            }
          });
          setTimeout(() => {
            console.log('[AUTH][Callback] onAuthStateChange wait timed out (5s)');
            subscription.unsubscribe();
            resolve();
          }, 5000);
        });

        const { data: final } = await supabase.auth.getSession();
        console.log('[AUTH][Callback] Final getSession() result', {
          hasSession: !!final.session,
          userId: final.session?.user?.id,
        });
        if (!final.session?.user) {
          console.error('[AUTH][Callback] Sign-in did not complete — no session after fallbacks');
          toast({
            title: isSignupConfirmation ? "Email confirmed" : "Sign in failed",
            description: isSignupConfirmation
              ? "Your account is active. Please sign in with your email and password."
              : "Please try again.",
            variant: isSignupConfirmation ? "default" : "destructive",
          });
          navigate('/login', { replace: true });
        }
      } catch (err: any) {
        console.error('[AUTH][Callback] Unhandled error in callback flow', {
          message: err?.message,
          name: err?.name,
          stack: err?.stack,
        });
        toast({
          title: isSignupConfirmation ? "Confirmation failed" : "Sign in failed",
          description: "Please try again.",
          variant: "destructive",
        });
        navigate('/login', { replace: true });
      }
    };

    go();
  }, []);

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
