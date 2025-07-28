import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Tag {
  id: string;
  name: string;
  category: string;
  usage_count: number;
  is_moderated: boolean;
  is_flagged: boolean;
  flagged_reason?: string;
  created_at: string;
  updated_at: string;
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<Tag[]> => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('is_flagged', false)
        .order('usage_count', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });
}

export function usePopularTags(limit = 20) {
  return useQuery({
    queryKey: ['popularTags', limit],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('tags')
        .select('name')
        .eq('is_flagged', false)
        .order('usage_count', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data.map(tag => tag.name);
    }
  });
}

export function useTagSuggestions(query: string) {
  return useQuery({
    queryKey: ['tagSuggestions', query],
    queryFn: async (): Promise<string[]> => {
      if (!query || query.length < 2) return [];
      
      const { data, error } = await supabase
        .from('tags')
        .select('name')
        .eq('is_flagged', false)
        .ilike('name', `%${query}%`)
        .order('usage_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data.map(tag => tag.name);
    },
    enabled: query.length >= 2
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tagName: string) => {
      const { data, error } = await supabase
        .from('tags')
        .insert([{ name: tagName.toLowerCase().trim() }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['popularTags'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating tag",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useFlagTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tagId, reason }: { tagId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .update({ 
          is_flagged: true, 
          flagged_reason: reason 
        })
        .eq('id', tagId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({
        title: "Tag flagged",
        description: "Thank you for reporting this tag. It will be reviewed by our moderation team."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error flagging tag",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}