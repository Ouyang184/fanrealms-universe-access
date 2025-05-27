
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CreatorSubscriptionWithDetails {
  id: string;
  user_id: string;
  creator_id: string;
  tier_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  amount_paid: number | null;
  platform_fee: number | null;
  creator_earnings: number | null;
  created_at: string;
  updated_at: string | null;
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
        .from('creator_subscriptions')
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
        console.error('Error fetching user subscriptions:', error);
        throw error;
      }

      console.log('Found user subscriptions:', subscriptions?.length || 0);
      return subscriptions as CreatorSubscriptionWithDetails[] || [];
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 3000, // Refetch every 3 seconds to catch updates quickly
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    userSubscriptions,
    subscriptionsLoading,
    refetchSubscriptions
  };
};
