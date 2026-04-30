import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeReturnTo } from "@/utils/auth-redirects";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const handled = useRef(false);

  const returnTo = sanitizeReturnTo(searchParams.get('returnTo'), '/dashboard');
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
      toast({
        title: 'Sign in failed',
        description: oauthErrorDesc || oauthError,
        variant: 'destructive',
      });
      navigate('/login', { replace: true });
      return;
    }

    const finish = (target: string) => {
      // Hard navigate so the next page boots with the session already
      // committed to localStorage and AuthContext re-initialises cleanly.
      window.location.replace(target);
    };

    const go = async () => {
      try {
        const code = searchParams.get('code');

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            toast({
              title: 'Sign in failed',
              description: error.message,
              variant: 'destructive',
            });
            navigate('/login', { replace: true });
            return;
          }
          if (data?.session?.user) {
            toast({ title: 'Signed in successfully!' });
            finish(returnTo);
            return;
          }
        }

        // Implicit flow / existing session fallback
        const { data: existing } = await supabase.auth.getSession();
        if (existing.session?.user) {
          toast({ title: 'Signed in successfully!' });
          finish(returnTo);
          return;
        }

        // Nothing to do — bounce back to login.
        toast({
          title: isSignupConfirmation ? 'Email confirmed' : 'Sign in failed',
          description: isSignupConfirmation
            ? 'Your account is active. Please sign in.'
            : 'Please try again.',
          variant: isSignupConfirmation ? 'default' : 'destructive',
        });
        navigate('/login', { replace: true });
      } catch (err: any) {
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
