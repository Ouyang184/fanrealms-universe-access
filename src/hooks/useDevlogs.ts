import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useUserDevlogs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-devlogs', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devlogs')
        .select('*, projects:project_id(id, title, slug)')
        .eq('author_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDevlog(id?: string) {
  return useQuery({
    queryKey: ['devlog', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('devlogs').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export interface DevlogInput {
  id?: string;
  project_id: string;
  title: string;
  content: string;
  tags?: string[];
  status?: 'draft' | 'published';
}

export function useSaveDevlog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DevlogInput) => {
      const payload = {
        project_id: input.project_id,
        title: input.title,
        content: input.content,
        tags: input.tags ?? [],
        status: input.status ?? 'published',
        author_id: user!.id,
      };
      if (input.id) {
        const { data, error } = await supabase.from('devlogs').update(payload).eq('id', input.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from('devlogs').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-devlogs'] });
    },
    onError: (e: Error) => toast.error('Failed: ' + e.message),
  });
}

export function useDeleteDevlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('devlogs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-devlogs'] });
    },
    onError: (e: Error) => toast.error('Failed to delete: ' + e.message),
  });
}
