import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const FORUM_CATEGORIES = [
  'General',
  'Game Dev',
  'Web Dev',
  'Data Science',
  'Design',
  'Showcase',
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

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
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
