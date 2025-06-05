
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

      // First get user_subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (subscriptionsError) {
        console.error('[useCreatorSubscribers] Error fetching subscriptions:', subscriptionsError);
        return [];
      }

      if (!subscriptionsData || subscriptionsData.length === 0) {
        console.log('[useCreatorSubscribers] No subscriptions found');
        return [];
      }

      console.log('[useCreatorSubscribers] Raw subscription data:', subscriptionsData.length, 'records');

      // Filter out subscriptions that are cancelled and past their period end
      const now = new Date().getTime();
      const activeSubscribers = subscriptionsData.filter(sub => {
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
      });

      console.log('[useCreatorSubscribers] Filtered active subscribers:', activeSubscribers.length);

      // Get unique user IDs and tier IDs for batch fetching
      const userIds = [...new Set(activeSubscribers.map(sub => sub.user_id))];
      const tierIds = [...new Set(activeSubscribers.map(sub => sub.tier_id))];

      // Fetch users data
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, email, profile_picture')
        .in('id', userIds);

      if (usersError) {
        console.error('[useCreatorSubscribers] Error fetching users:', usersError);
      }

      // Fetch tiers data
      const { data: tiersData, error: tiersError } = await supabase
        .from('membership_tiers')
        .select('id, title, price')
        .in('id', tierIds);

      if (tiersError) {
        console.error('[useCreatorSubscribers] Error fetching tiers:', tiersError);
      }

      // Create lookup maps for efficient joining
      const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);
      const tiersMap = new Map(tiersData?.map(tier => [tier.id, tier]) || []);

      // Transform the data to match the expected interface
      const transformedSubscribers = activeSubscribers.map(sub => {
        const userData = usersMap.get(sub.user_id);
        const tierData = tiersMap.get(sub.tier_id);

        return {
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
          // Required fields for SubscriberWithDetails interface
          name: userData?.username || 'Unknown User',
          email: userData?.email || '',
          avatarUrl: userData?.profile_picture || undefined,
          tier: {
            title: tierData?.title || 'Unknown Tier'
          },
          tierPrice: Number(tierData?.price || sub.amount),
          subscriptionDate: sub.created_at,
          // User data for compatibility - fix the structure here
          user: userData ? {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            profile_picture: userData.profile_picture
          } : null,
          // Users data for compatibility (note the 's')
          users: userData ? {
            username: userData.username,
            email: userData.email,
            profile_picture: userData.profile_picture
          } : {
            username: 'Unknown User',
            email: '',
            profile_picture: null
          },
          // Tier data for compatibility - fix the structure here
          membership_tiers: tierData ? {
            title: tierData.title,
            price: Number(tierData.price)
          } : {
            title: 'Unknown Tier',
            price: Number(sub.amount)
          }
        };
      });

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
