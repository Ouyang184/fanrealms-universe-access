
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
      
      // First try to get from creator_subscriptions table (Stripe-managed subscriptions)
      const { data: stripeSubscriptions, error: stripeError } = await supabase
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

      if (stripeError) {
        console.error('Error fetching Stripe subscriptions:', stripeError);
      }

      console.log('Found Stripe subscriptions:', stripeSubscriptions?.length || 0);

      // If no Stripe subscriptions found, check the basic subscriptions table
      if (!stripeSubscriptions || stripeSubscriptions.length === 0) {
        console.log('No Stripe subscriptions found, checking basic subscriptions...');
        
        const { data: basicSubscriptions, error: basicError } = await supabase
          .from('subscriptions')
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
          .eq('is_paid', true)
          .order('created_at', { ascending: false });

        if (basicError) {
          console.error('Error fetching basic subscriptions:', basicError);
          return [];
        }

        console.log('Found basic subscriptions:', basicSubscriptions?.length || 0);

        // Convert basic subscriptions to the expected format
        return (basicSubscriptions || []).map(sub => ({
          id: sub.id,
          user_id: sub.user_id,
          creator_id: sub.creator_id,
          tier_id: sub.tier_id || '',
          stripe_subscription_id: '',
          stripe_customer_id: '',
          status: 'active',
          current_period_start: null,
          current_period_end: null,
          amount_paid: sub.tier?.price || null,
          platform_fee: null,
          creator_earnings: null,
          created_at: sub.created_at,
          updated_at: null,
          creator: sub.creator,
          tier: sub.tier
        })) as CreatorSubscriptionWithDetails[];
      }

      return stripeSubscriptions as CreatorSubscriptionWithDetails[] || [];
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 5000, // Refetch every 5 seconds to catch updates quickly
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    userSubscriptions,
    subscriptionsLoading,
    refetchSubscriptions
  };
};
