
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useCreatorSubscribers = (creatorId: string) => {
  const { user } = useAuth();

  const { data: subscribers, isLoading, refetch } = useQuery({
    queryKey: ['creator-subscribers-real', creatorId],
    queryFn: async () => {
      if (!creatorId) return [];

      console.log('[useCreatorSubscribers] Fetching subscribers for creator:', creatorId);

      // Query user_subscriptions table directly with joins for user and tier data
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          users!user_subscriptions_user_id_fkey (
            id,
            username,
            email,
            profile_picture
          ),
          membership_tiers!user_subscriptions_tier_id_fkey (
            id,
            title,
            price
          )
        `)
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useCreatorSubscribers] Error fetching subscribers:', error);
        return [];
      }

      console.log('[useCreatorSubscribers] Raw subscription data:', data?.length || 0, 'records');

      // Filter out subscriptions that are cancelled and past their period end
      const now = new Date().getTime();
      const activeSubscribers = data?.filter(sub => {
        // If not scheduled to cancel, it's definitely active
        if (!sub.cancel_at_period_end) return true;
        
        // If scheduled to cancel, check if still within the current period
        if (sub.current_period_end) {
          const periodEnd = new Date(sub.current_period_end).getTime();
          const isStillActive = periodEnd > now;
          
          console.log('[useCreatorSubscribers] Checking cancelled subscription:', {
            id: sub.id,
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_end: sub.current_period_end,
            periodEnd: new Date(periodEnd).toISOString(),
            now: new Date(now).toISOString(),
            isStillActive
          });
          
          return isStillActive;
        }
        
        return true; // Keep if no period end data
      }) || [];

      console.log('[useCreatorSubscribers] Filtered active subscribers:', activeSubscribers.length);

      // Transform the data to include proper status information
      const transformedSubscribers = activeSubscribers.map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        creator_id: sub.creator_id,
        tier_id: sub.tier_id,
        stripe_subscription_id: sub.stripe_subscription_id,
        stripe_customer_id: sub.stripe_customer_id,
        status: sub.cancel_at_period_end ? 'cancelling' : 'active',
        amount: Number(sub.amount),
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        // User data
        user: sub.users ? {
          id: sub.users.id,
          username: sub.users.username,
          email: sub.users.email,
          profile_picture: sub.users.profile_picture
        } : null,
        // Tier data  
        tier: sub.membership_tiers ? {
          id: sub.membership_tiers.id,
          title: sub.membership_tiers.title,
          price: Number(sub.membership_tiers.price)
        } : null
      }));

      console.log('[useCreatorSubscribers] Final transformed subscribers:', transformedSubscribers.length);
      
      // Log status breakdown for debugging
      const statusBreakdown = transformedSubscribers.reduce((counts: any, sub: any) => {
        counts[sub.status] = (counts[sub.status] || 0) + 1;
        return counts;
      }, {});
      
      console.log('[useCreatorSubscribers] Status breakdown:', statusBreakdown);

      return transformedSubscribers;
    },
    enabled: !!creatorId && !!user,
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Auto-refetch every minute for real-time updates
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 3
  });

  return {
    subscribers,
    isLoading,
    refetch
  };
};
