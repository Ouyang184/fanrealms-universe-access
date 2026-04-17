
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useCreatorStripeStatus = (creatorId: string) => {
  const { data: creatorStripeStatus } = useQuery({
    queryKey: ['creatorStripeStatus', creatorId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('creator_stripe_status')
        .select('stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled')
        .eq('creator_id', creatorId)
        .maybeSingle();

      if (error) throw error;
      return data as { stripe_account_id: string | null; stripe_onboarding_complete: boolean | null; stripe_charges_enabled: boolean | null } | null;
    },
    enabled: !!creatorId
  });

  const isCreatorStripeReady = creatorStripeStatus?.stripe_account_id && 
                              creatorStripeStatus?.stripe_onboarding_complete && 
                              creatorStripeStatus?.stripe_charges_enabled;

  return {
    creatorStripeStatus,
    isCreatorStripeReady
  };
};
