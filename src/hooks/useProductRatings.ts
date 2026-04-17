import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ProductRating {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  updated_at: string;
  users?: { username: string | null } | null;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export function useProductRatings(productId: string) {
  return useQuery({
    queryKey: ['product-ratings', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_ratings')
        .select('*, users:user_id(username)')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProductRating[];
    },
    enabled: !!productId,
  });
}

export function useProductRatingSummary(productId: string): RatingSummary {
  const { data: ratings } = useProductRatings(productId);
  if (!ratings || ratings.length === 0) return { average: 0, count: 0 };
  const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  return { average, count: ratings.length };
}

export function useMyProductRating(productId: string) {
  const { user } = useAuth();
  const { data: ratings } = useProductRatings(productId);
  if (!user || !ratings) return null;
  return ratings.find((r) => r.user_id === user.id) ?? null;
}

export function useSubmitProductRating(productId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rating, review }: { rating: number; review?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('product_ratings').upsert(
        { product_id: productId, user_id: user.id, rating, review: review ?? null },
        { onConflict: 'product_id,user_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-ratings', productId] });
    },
  });
}

export function useDeleteProductRating(productId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('product_ratings')
        .delete()
        .eq('product_id', productId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-ratings', productId] });
    },
  });
}
