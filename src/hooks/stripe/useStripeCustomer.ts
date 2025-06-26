
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useStripeCustomer = () => {
  const { user } = useAuth();

  const { data: stripeCustomer, isLoading } = useQuery({
    queryKey: ['stripeCustomer', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  return {
    stripeCustomer,
    isLoading
  };
};
