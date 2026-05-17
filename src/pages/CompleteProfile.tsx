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
import { SocialLinksEditor, normalizeSocialUrl, type SocialLinkDraft } from '@/components/profile/SocialLinksEditor';

const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;

export default function CompleteProfile() {
  const { user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinkDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; socialLinks?: string }>({});

  // No "skip if already complete" effect here — AuthGuard wraps this
  // route and handles the already-complete case in one place.


  const validate = (): boolean => {
    const errors: { username?: string } = {};
    if (!USERNAME_RE.test(username)) {
      errors.username =
        'Username must be 3–30 characters and contain only lowercase letters, numbers, underscores, or hyphens.';
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

      // Check username uniqueness against public.users (the source of truth
      // for ALL accounts, not just creators). Exclude this user's own row.
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .ilike('username', cleanUsername)
        .neq('id', user!.id)
        .maybeSingle();

      if (existing) {
        setFieldErrors({ username: 'That username is already taken. Please choose another.' });
        return;
      }

      // Normalize + validate optional social links before persisting.
      const normalizedLinks: SocialLinkDraft[] = [];
      for (let i = 0; i < socialLinks.length; i++) {
        const link = socialLinks[i];
        const rawUrl = link.url.trim();
        if (!rawUrl && !link.label.trim()) continue; // skip fully empty rows
        const normalized = normalizeSocialUrl(rawUrl);
        if (!normalized) {
          setFieldErrors({ socialLinks: `Link #${i + 1} has an invalid URL.` });
          return;
        }
        normalizedLinks.push({ label: link.label.trim().slice(0, 60), url: normalized });
      }

      // Update the user row (auto-created by on_auth_user_created trigger).
      // Becoming a creator is a separate, opt-in flow — we do NOT create a
      // creators row here. Non-creators can use marketplace/forum/jobs without one.
      const { error: updateError } = await supabase
        .from('users')
        .update({ username: cleanUsername, social_links: normalizedLinks })
        .eq('id', user!.id);

      if (updateError) throw updateError;

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
      const returnTo = sanitizeReturnTo(params.get('returnTo'), '/library');
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
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-xl font-bold">FanRealms</Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Choose your username</CardTitle>
            <CardDescription className="text-center">
              Pick a username to get started. You can change other profile details later.
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
                <Input
                  id="username"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value.toLowerCase());
                    setFieldErrors(prev => ({ ...prev, username: undefined }));
                  }}
                  placeholder="yourname"
                  autoComplete="username"
                  maxLength={30}
                  disabled={submitting}
                />
                {fieldErrors.username && (
                  <p className="text-xs text-destructive">{fieldErrors.username}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  3–30 chars · lowercase letters, numbers, _ and - only
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div>
                  <h3 className="text-sm font-medium">Social links <span className="text-muted-foreground font-normal">(optional)</span></h3>
                  <p className="text-xs text-muted-foreground">Add links to your website, Twitter, YouTube, etc.</p>
                </div>
                <SocialLinksEditor
                  links={socialLinks}
                  onChange={(next) => {
                    setSocialLinks(next);
                    setFieldErrors(prev => ({ ...prev, socialLinks: undefined }));
                  }}
                  disabled={submitting}
                />
                {fieldErrors.socialLinks && (
                  <p className="text-xs text-destructive">{fieldErrors.socialLinks}</p>
                )}
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
