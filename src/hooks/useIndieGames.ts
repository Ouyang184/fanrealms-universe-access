import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const GAME_GENRES = ['All', 'Action', 'RPG', 'Puzzle', 'Platformer', 'Roguelike', 'Strategy', 'Simulation', 'Horror', 'Other'];

export interface IndieGame {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  genre?: string;
  thumbnail_url?: string;
  external_url: string;
  external_platform?: string;
  created_at: string;
}

export function useIndieGames(genre?: string) {
  return useQuery({
    queryKey: ['indie-games', genre],
    queryFn: async () => {
      let query = (supabase as any)
        .from('indie_games')
        .select('*')
        .order('created_at', { ascending: false });

      if (genre && genre !== 'All' && genre !== 'all') {
        query = query.eq('genre', genre);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as IndieGame[];
    },
  });
}

export function useUserGames() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-games', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('indie_games')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as IndieGame[];
    },
  });
}

export function useAddGame() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (game: Omit<IndieGame, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await (supabase as any)
        .from('indie_games')
        .insert({ ...game, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indie-games'] });
      queryClient.invalidateQueries({ queryKey: ['user-games'] });
      toast.success('Game added!');
    },
    onError: () => {
      toast.error('Failed to add game. Please try again.');
    },
  });
}
