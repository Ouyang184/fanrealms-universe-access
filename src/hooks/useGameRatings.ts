import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface RatingSummary {
  average: number;
  count: number;
}

export function useGameRatings(gameId: string) {
  return useQuery({
    queryKey: ['game-ratings', gameId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_ratings')
        .select('id, game_id, user_id, rating, created_at')
        .eq('game_id', gameId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!gameId,
  });
}

export function useGameRatingSummary(gameId: string): RatingSummary {
  const { data: ratings } = useGameRatings(gameId);
  if (!ratings || ratings.length === 0) return { average: 0, count: 0 };
  const average = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length;
  return { average, count: ratings.length };
}

export function useSubmitGameRating(gameId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rating: number) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('game_ratings').upsert(
        { game_id: gameId, user_id: user.id, rating },
        { onConflict: 'game_id,user_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-ratings', gameId] });
    },
  });
}
