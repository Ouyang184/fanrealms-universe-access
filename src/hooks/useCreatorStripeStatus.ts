
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useCreatorStripeStatus = (creatorId: string) => {
  const { data: creatorStripeStatus } = useQuery({
    queryKey: ['creatorStripeStatus', creatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creators')
        .select('stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled')
        .eq('id', creatorId as any)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!creatorId
  });

  const isCreatorStripeReady = (creatorStripeStatus as any)?.stripe_account_id && 
                              (creatorStripeStatus as any)?.stripe_onboarding_complete && 
                              (creatorStripeStatus as any)?.stripe_charges_enabled;

  return {
    creatorStripeStatus,
    isCreatorStripeReady
  };
};
