import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const handled = useRef(false);
  const navigated = useRef(false);

  const returnTo = searchParams.get('returnTo') || '/dashboard';

  // Once AuthContext confirms the user is set, redirect.
  useEffect(() => {
    if (!loading && user && !navigated.current) {
      navigated.current = true;
      navigate(returnTo, { replace: true });
    }
  }, [user, loading, navigate, returnTo]);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const currentUrl = window.location.href;

    // Password reset flow
    const isRecovery =
      searchParams.get('type') === 'recovery' ||
      new URLSearchParams(window.location.hash.substring(1)).get('type') === 'recovery' ||
      currentUrl.includes('type=recovery');

    if (isRecovery) {
      navigate('/reset-password', { replace: true });
      return;
    }

    const go = async () => {
      try {
        // PKCE code exchange
        const code = searchParams.get('code');
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session?.user) {
            toast({ title: "Signed in successfully!" });
            return; // first useEffect handles navigation
          }
          console.warn('AuthCallback: code exchange failed', error?.message);
        }

        // Implicit flow / existing session fallback
        const { data: existing } = await supabase.auth.getSession();
        if (existing.session?.user) {
          toast({ title: "Signed in successfully!" });
          return;
        }

        // Wait briefly for onAuthStateChange
        await new Promise<void>((resolve) => {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              subscription.unsubscribe();
              toast({ title: "Signed in successfully!" });
              resolve();
            }
          });
          setTimeout(() => { subscription.unsubscribe(); resolve(); }, 5000);
        });

        const { data: final } = await supabase.auth.getSession();
        if (!final.session?.user) {
          toast({ title: "Sign in failed", description: "Please try again.", variant: "destructive" });
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('AuthCallback error:', err);
        toast({ title: "Sign in failed", description: "Please try again.", variant: "destructive" });
        navigate('/login', { replace: true });
      }
    };

    go();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-4" />
        <h2 className="text-xl font-medium mb-2">Signing you in…</h2>
        <p className="text-muted-foreground">Just a moment.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
