
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserSubscriptions = () => {
  const { user } = useAuth();

  const { data: userSubscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['user-subscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Add query optimization with limits and proper indexing
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          creator:creators!inner(id, display_name, profile_image_url),
          tier:membership_tiers!inner(id, title, price)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50); // Prevent large result sets
      
      if (error) {
        console.error('Error fetching user subscriptions:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to reduce queries
    gcTime: 10 * 60 * 1000,
  });

  return {
    userSubscriptions: userSubscriptions || [],
    subscriptionsLoading,
    refetchSubscriptions,
  };
};
