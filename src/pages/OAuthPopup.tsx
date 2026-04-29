import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * This page runs inside a popup opened from fanrealms.com.
 * It immediately initiates Google OAuth using THIS origin (lovable.app)
 * so the PKCE code_verifier is stored here — no Cloudflare proxy issues.
 * After auth the callback page sends the session back via postMessage.
 */
export default function OAuthPopup() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const provider = (searchParams.get('provider') || 'google') as 'google' | 'discord';

    supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?relay=true`,
        skipBrowserRedirect: false,
      },
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <LoadingSpinner className="mx-auto" />
        <p className="text-sm text-muted-foreground">Connecting to Google…</p>
      </div>
    </div>
  );
}
