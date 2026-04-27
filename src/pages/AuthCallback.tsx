import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const currentUrl = window.location.href;

    // Password reset flow — redirect immediately
    const isRecovery =
      searchParams.get('type') === 'recovery' ||
      new URLSearchParams(window.location.hash.substring(1)).get('type') === 'recovery' ||
      currentUrl.includes('type=recovery');

    if (isRecovery) {
      navigate('/reset-password', { replace: true });
      return;
    }

    // Listen for auth state — Supabase client handles code exchange automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthCallback: event', event, 'session', !!session);

      if (event === 'SIGNED_IN' && session?.user) {
        subscription.unsubscribe();
        toast({ title: "Signed in successfully!" });
        navigate('/dashboard', { replace: true });
        return;
      }

      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') return;

      // If we get an error or no session after a short wait, fall back
    });

    // Fallback: if onAuthStateChange doesn't fire within 5s, try getSession manually
    const timeout = setTimeout(async () => {
      subscription.unsubscribe();

      try {
        const code = searchParams.get('code');
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session?.user) {
            toast({ title: "Signed in successfully!" });
            navigate('/dashboard', { replace: true });
            return;
          }
        }

        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          toast({ title: "Signed in successfully!" });
          navigate('/dashboard', { replace: true });
        } else {
          toast({ title: "Sign in failed", description: "Please try again.", variant: "destructive" });
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('AuthCallback fallback error:', err);
        toast({ title: "Sign in failed", description: "Please try again.", variant: "destructive" });
        navigate('/login', { replace: true });
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
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
