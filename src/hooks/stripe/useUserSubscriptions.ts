
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUserSubscriptions(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-subscriptions', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId as any)
        .eq('status', 'active' as any);
      
      if (error) {
        console.error('Error fetching user subscriptions:', error);
        return [];
      }
      
      return data as any[];
    },
    enabled: !!userId,
  });
}
