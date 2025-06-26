
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Subscription {
  id: string;
  user_id: string;
  creator_id: string;
  tier_id: string;
  status: string;
  amount: number;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
  updated_at: string;
  membership_tiers?: {
    id: string;
    title: string;
    price: number;
    description: string;
  };
  creators?: {
    id: string;
    display_name: string | null;
    profile_image_url: string | null;
    users: {
      username: string;
      profile_picture: string | null;
    };
  };
}

export const useSubscriptions = () => {
  const { user } = useAuth();

  const { data: subscriptions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['user-subscriptions', user?.id],
    queryFn: async (): Promise<Subscription[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          membership_tiers (
            id,
            title,
            price,
            description
          ),
          creators (
            id,
            display_name,
            profile_image_url,
            users (
              username,
              profile_picture
            )
          )
        `)
        .eq('user_id', user.id as any)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
      }

      return (data as any) || [];
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });

  const activeSubscriptions = (subscriptions as any).filter((sub: any) => 
    sub.status === 'active'
  );

  const cancelledSubscriptions = (subscriptions as any).filter((sub: any) => 
    sub.status === 'canceled' || sub.cancel_at_period_end
  );

  return {
    subscriptions,
    activeSubscriptions,
    cancelledSubscriptions,
    isLoading,
    error,
    refetch
  };
};
