import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────

export type JamStatus = 'upcoming' | 'active' | 'voting' | 'ended';

export interface Jam {
  id: string;
  title: string;
  description: string | null;
  thread_id: string | null;
  starts_at: string;
  ends_at: string;
  voting_ends_at: string;
  prize_pool: { place: string; label: string; prize: string }[];
  created_at: string;
}

export interface JamSubmissionScore {
  id: string;
  jam_id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  avg_usefulness: number;
  avg_quality: number;
  avg_creativity: number;
  avg_overall: number;
  vote_count: number;
}

export interface JamVote {
  id: string;
  submission_id: string;
  voter_id: string;
  usefulness: number;
  quality: number;
  creativity: number;
}

// ── Status helper ──────────────────────────────────────────────────────

export function getJamStatus(jam: Jam): JamStatus {
  const now = Date.now();
  const starts = new Date(jam.starts_at).getTime();
  const ends = new Date(jam.ends_at).getTime();
  const votingEnds = new Date(jam.voting_ends_at).getTime();
  if (now < starts) return 'upcoming';
  if (now <= ends) return 'active';
  if (now <= votingEnds) return 'voting';
  return 'ended';
}

// ── Hooks ──────────────────────────────────────────────────────────────

export function useJam(jamId: string) {
  return useQuery({
    queryKey: ['jam', jamId],
    enabled: !!jamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jams')
        .select('*')
        .eq('id', jamId)
        .single();
      if (error) throw error;
      return data as Jam;
    },
  });
}

export function useJamSubmissions(jamId: string) {
  return useQuery({
    queryKey: ['jam-submissions', jamId],
    enabled: !!jamId,
    queryFn: async () => {
      const { data: scores, error: scoresError } = await supabase
        .from('jam_submission_scores')
        .select('*')
        .eq('jam_id', jamId)
        .order('avg_overall', { ascending: false })
        .order('vote_count', { ascending: false })
        .order('created_at', { ascending: true });
      if (scoresError) throw scoresError;

      if (!scores || scores.length === 0) return [];

      const productIds = scores.map((s: any) => s.product_id);
      const userIds = scores.map((s: any) => s.user_id);

      const [{ data: products }, { data: users }] = await Promise.all([
        supabase
          .from('digital_products')
          .select('id, title, short_description, cover_image_url, category, status')
          .in('id', productIds),
        supabase
          .from('users')
          .select('id, username, display_name, profile_image_url')
          .in('id', userIds),
      ]);

      const productMap = Object.fromEntries((products ?? []).map((p: any) => [p.id, p]));
      const userMap = Object.fromEntries((users ?? []).map((u: any) => [u.id, u]));

      return (scores as JamSubmissionScore[])
        .filter((s) => productMap[s.product_id]?.status === 'published')
        .map((s) => ({
          ...s,
          product: productMap[s.product_id] ?? null,
          creator: userMap[s.user_id] ?? null,
        }));
    },
  });
}

export function useMyJamSubmission(jamId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-jam-submission', jamId, user?.id],
    enabled: !!jamId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jam_submissions')
        .select('id, product_id')
        .eq('jam_id', jamId)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyJamVotes(jamId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-jam-votes', jamId, user?.id],
    enabled: !!jamId && !!user?.id,
    queryFn: async () => {
      const { data: subs } = await supabase
        .from('jam_submissions')
        .select('id')
        .eq('jam_id', jamId);

      if (!subs || subs.length === 0) return {} as Record<string, JamVote>;

      const subIds = subs.map((s: any) => s.id);
      const { data: votes, error } = await supabase
        .from('jam_votes')
        .select('*')
        .eq('voter_id', user!.id)
        .in('submission_id', subIds);
      if (error) throw error;

      return Object.fromEntries(
        (votes ?? []).map((v: any) => [v.submission_id, v as JamVote])
      );
    },
  });
}

export function useSubmitToJam() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ jamId, productId }: { jamId: string; productId: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('jam_submissions')
        .insert({ jam_id: jamId, user_id: user!.id, product_id: productId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { jamId }) => {
      queryClient.invalidateQueries({ queryKey: ['jam-submissions', jamId] });
      queryClient.invalidateQueries({ queryKey: ['my-jam-submission', jamId] });
      toast.success('Entry submitted!');
    },
    onError: (err: Error) => {
      toast.error('Failed to submit: ' + err.message);
    },
  });
}

export function useVoteOnSubmission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      submissionId,
      jamId,
      usefulness,
      quality,
      creativity,
    }: {
      submissionId: string;
      jamId: string;
      usefulness: number;
      quality: number;
      creativity: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('jam_votes')
        .upsert(
          { submission_id: submissionId, voter_id: user!.id, usefulness, quality, creativity },
          { onConflict: 'submission_id,voter_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return { data, jamId };
    },
    onSuccess: ({ jamId }) => {
      queryClient.invalidateQueries({ queryKey: ['jam-submissions', jamId] });
      queryClient.invalidateQueries({ queryKey: ['my-jam-votes', jamId] });
      toast.success('Vote saved');
    },
    onError: (err: Error) => {
      toast.error('Vote failed: ' + err.message);
    },
  });
}
