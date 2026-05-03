import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeReturnTo } from '@/utils/auth-redirects';
import { fetchProfileCompletion, resolveCompletionRoute } from '@/lib/auth/profileCompletion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';

const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;

export default function CompleteProfile() {
  const { user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; displayName?: string }>({});

  // No "skip if already complete" effect here — AuthGuard wraps this
  // route and handles the already-complete case in one place.


  const validate = (): boolean => {
    const errors: { username?: string; displayName?: string } = {};
    if (!USERNAME_RE.test(username)) {
      errors.username =
        'Username must be 3–30 characters and contain only lowercase letters, numbers, underscores, or hyphens.';
    }
    if (!displayName.trim() || displayName.trim().length > 60) {
      errors.displayName = 'Display name must be between 1 and 60 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);

    try {
      const cleanUsername = username.trim().toLowerCase();
      const cleanDisplayName = displayName.trim();

      // Check username uniqueness (exclude the current user's own row)
      const { data: existing } = await supabase
        .from('creators')
        .select('id')
        .eq('username', cleanUsername)
        .neq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        setFieldErrors({ username: 'That username is already taken. Please choose another.' });
        return;
      }

      // Upsert the creators row with username + display_name
      const { error: upsertError } = await supabase
        .from('creators')
        .upsert(
          { user_id: user!.id, username: cleanUsername, display_name: cleanDisplayName },
          { onConflict: 'user_id' }
        );

      if (upsertError) throw upsertError;

      // Also keep users.username in sync
      await supabase
        .from('users')
        .update({ username: cleanUsername })
        .eq('id', user!.id);

      // Verify completion against the freshly-persisted Supabase row, not
      // React state. Only navigate when the database itself agrees the
      // profile is complete — otherwise show an inline error and stay
      // here so the user is never silently bounced back.
      const complete = await fetchProfileCompletion(user!.id);
      if (!complete) {
        setError("We couldn't verify your profile was saved. Please try again.");
        return;
      }

      // Sync AuthContext with the persisted truth so AuthGuard on the
      // destination route sees isProfileComplete=true on first render.
      await refreshProfile();

      const params = new URLSearchParams(location.search);
      const returnTo = sanitizeReturnTo(params.get('returnTo'), '/dashboard');
      const target = resolveCompletionRoute(true, returnTo);
      navigate(target, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-xl font-bold">FanRealms</Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Set up your profile</CardTitle>
            <CardDescription className="text-center">
              Choose a username and display name to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-sm text-destructive text-center bg-destructive/10 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <div className="space-y-1">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    fanrealms.com/
                  </span>
                  <Input
                    id="username"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value.toLowerCase());
                      setFieldErrors(prev => ({ ...prev, username: undefined }));
                    }}
                    placeholder="yourname"
                    className="pl-[120px]"
                    autoComplete="username"
                    maxLength={30}
                    disabled={submitting}
                  />
                </div>
                {fieldErrors.username && (
                  <p className="text-xs text-destructive">{fieldErrors.username}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  3–30 chars · lowercase letters, numbers, _ and - only
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="displayName" className="text-sm font-medium">
                  Display name
                </label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={e => {
                    setDisplayName(e.target.value);
                    setFieldErrors(prev => ({ ...prev, displayName: undefined }));
                  }}
                  placeholder="e.g. Jake's Studio"
                  maxLength={60}
                  disabled={submitting}
                />
                {fieldErrors.displayName && (
                  <p className="text-xs text-destructive">{fieldErrors.displayName}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Shown publicly on your profile and listings
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Saving…' : 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
