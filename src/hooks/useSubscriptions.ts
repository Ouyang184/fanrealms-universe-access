
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useSubscriptions = () => {
  const { user } = useAuth();

  const { data: subscriptions, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          user_id,
          creator_id,
          tier_id,
          created_at,
          is_paid,
          creator:creators (
            id,
            user_id,
            display_name,
            bio,
            profile_image_url,
            banner_url,
            follower_count,
            tags,
            users (
              id,
              username,
              email,
              profile_picture
            )
          ),
          tier:membership_tiers (
            id,
            title,
            description,
            price
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  return {
    subscriptions,
    loadingSubscriptions,
  };
};
