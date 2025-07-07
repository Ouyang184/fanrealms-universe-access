
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface UserSubscriptionWithDetails {
  id: string;
  user_id: string;
  creator_id: string;
  tier_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string;
  amount: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    display_name: string | null;
    bio: string | null;
    profile_image_url: string | null;
    banner_url: string | null;
    users?: {
      id: string;
      username: string;
      email: string;
      profile_picture: string | null;
    } | null;
  } | null;
  tier?: {
    id: string;
    title: string;
    description: string | null;
    price: number;
  } | null;
}

export const useUserSubscriptions = () => {
  const { user } = useAuth();

  const { data: userSubscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['userActiveSubscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching active subscriptions for user:', user.id);
      
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          creator:creators (
            id,
            display_name,
            bio,
            profile_image_url,
            banner_url,
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
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        return [];
      }

      console.log('Found subscriptions:', subscriptions?.length || 0);
      return (subscriptions || []) as UserSubscriptionWithDetails[];
    },
    enabled: !!user?.id,
    staleTime: 0, // Force refresh - no cache for subscription updates
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    userSubscriptions,
    subscriptionsLoading,
    refetchSubscriptions
  };
};
