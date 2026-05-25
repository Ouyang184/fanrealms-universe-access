
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface UserSubscriptionWithDetails {
  id: string;
  user_id: string;
  creator_id: string;
  tier_id: string;
  status: string;
  amount: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
  updated_at: string;
  creators?: {
    id: string;
    display_name: string | null;
    bio: string | null;
    profile_image_url: string | null;
    banner_url: string | null;
    username: string;
  } | null;
  membership_tiers?: {
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


      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          user_id,
          creator_id,
          tier_id,
          status,
          amount,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          created_at,
          updated_at,
          creators!fk_user_subscriptions_creator_id (
            id,
            display_name,
            bio,
            profile_image_url,
            banner_url,
            username
          ),
          membership_tiers!fk_user_subscriptions_tier_id (
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
        return [];
      }

      return (subscriptions || []) as UserSubscriptionWithDetails[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 15, // 15 seconds — fresh enough for subscription state
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    userSubscriptions,
    subscriptionsLoading,
    refetchSubscriptions
  };
};
