
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useStripeCustomer(userId: string | undefined) {
  return useQuery({
    queryKey: ['stripe-customer', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', userId as any)
        .single();
      
      if (error) {
        console.error('Error fetching Stripe customer:', error);
        return null;
      }
      
      return data as any;
    },
    enabled: !!userId,
  });
}
