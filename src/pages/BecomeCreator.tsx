import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';

export default function BecomeCreator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isCreator, isLoading: checkingCreator } = useCreatorProfile();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [tags, setTags] = useState('');
  const [isNsfw, setIsNsfw] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (!checkingCreator && isCreator) {
      navigate('/dashboard', { replace: true });
    }
  }, [checkingCreator, isCreator, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('users')
        .select('username, display_name')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setUsername(data?.username ?? null);
      setDisplayName((data?.display_name as string) ?? '');
      setLoadingUser(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!username) {
      toast.error('Please complete your profile first.');
      navigate('/complete-profile');
      return;
    }
    if (!displayName.trim()) {
      toast.error('Display name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const { error } = await supabase.from('creators').insert({
        user_id: user.id,
        username,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        tags: tagList,
        is_nsfw: isNsfw,
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['creator-profile', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['userCreator', user.id] });

      toast.success("You're a creator! Welcome aboard.");
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create your creator profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.5px]">Become a Creator</h1>
            <p className="text-[13px] text-[#888] mt-0.5">
              Set up your creator profile to upload projects, list assets, and start earning.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 bg-white border border-[#eee] rounded-xl p-6"
        >
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display name *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your creator name"
              maxLength={60}
              required
              disabled={loadingUser}
            />
            {username && (
              <p className="text-[11px] text-[#aaa]">
                Your public URL will be <span className="font-mono">/{username}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Tell people what you make..."
            />
            <p className="text-[11px] text-[#aaa]">{bio.length}/500</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="pixel-art, gamedev, shaders"
            />
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <Checkbox
              id="nsfw"
              checked={isNsfw}
              onCheckedChange={(v) => setIsNsfw(v === true)}
            />
            <div>
              <Label htmlFor="nsfw" className="font-medium cursor-pointer">
                My content is NSFW
              </Label>
              <p className="text-[11px] text-[#888] mt-0.5">
                Mark your profile as adult content. You can change this later.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f0f0]">
            <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || loadingUser || !displayName.trim()}
              className="bg-primary hover:bg-[#3a7aab] text-white"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create my creator profile
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
