import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const FORUM_CATEGORIES = [
  'General',
  'Game Dev',
  'Art & Assets',
  'Audio & Music',
  'Design',
  'Showcase',
  'Playtesting',
  'Help',
] as const;

export function useForumThreads(category?: string) {
  return useQuery({
    queryKey: ['forum-threads', category],
    queryFn: async () => {
      let query = supabase
        .from('forum_threads')
        .select('*')
        .eq('status', 'published')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (category && category !== 'all' && category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch author info for all threads via security-definer RPC (works for anon)
      const authorIds = [...new Set(data.map((t: any) => t.author_id))];
      const { data: usersData } = await supabase
        .rpc('get_public_user_profiles', { _user_ids: authorIds });
      const usersMap = new Map(((usersData as any[]) || []).map((u: any) => [u.id, u]));

      return data.map((t: any) => ({
        ...t,
        users: usersMap.get(t.author_id) || null,
      }));
    },
  });
}

export function useForumThreadCounts() {
  return useQuery({
    queryKey: ['forum-thread-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_threads')
        .select('category')
        .eq('status', 'published');
      if (error) throw error;
      const counts: Record<string, number> = {};
      let total = 0;
      for (const row of data ?? []) {
        const c = (row as any).category || 'General';
        counts[c] = (counts[c] || 0) + 1;
        total += 1;
      }
      counts['All'] = total;
      return counts;
    },
  });
}

export function useForumThread(threadId: string) {
  return useQuery({
    queryKey: ['forum-thread', threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_threads')
        .select('*')
        .eq('id', threadId)
        .single();

      if (error) throw error;

      // Fetch author info separately
      if (data) {
        const { data: userData } = await supabase
          .from('users')
          .select('username, profile_picture')
          .eq('id', data.author_id)
          .single();
        return { ...data, users: userData };
      }
      return data;

      if (error) throw error;
      return data;
    },
  });
}

export function useForumReplies(threadId: string) {
  return useQuery({
    queryKey: ['forum-replies', threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_replies')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data) return [];

      // Fetch user info for all replies
      const authorIds = [...new Set(data.map((r) => r.author_id))];
      const { data: usersData } = await supabase
        .from('users')
        .select('id, username, profile_picture')
        .in('id', authorIds);

      const usersMap = new Map((usersData || []).map((u) => [u.id, u]));
      return data.map((r) => ({
        ...r,
        users: usersMap.get(r.author_id) || null,
      }));
    },
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (thread: {
      title: string;
      content: string;
      category?: string;
      tags?: string[];
    }) => {
      const { data, error } = await supabase
        .from('forum_threads')
        .insert({ ...thread, author_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-threads'] });
      toast.success('Thread created');
    },
    onError: (error) => {
      toast.error('Failed to create thread: ' + error.message);
    },
  });
}

export function useCreateReply() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (reply: {
      thread_id: string;
      content: string;
      parent_reply_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('forum_replies')
        .insert({ ...reply, author_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-replies', variables.thread_id] });
      queryClient.invalidateQueries({ queryKey: ['forum-threads'] });
      toast.success('Reply posted');
    },
    onError: (error) => {
      toast.error('Failed to post reply: ' + error.message);
    },
  });
}
