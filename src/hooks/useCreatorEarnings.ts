
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';

export interface CreatorEarning {
  id: string;
  creator_id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  payment_date: string | null;
  earning_type: 'subscription' | 'commission';
  commission_id: string | null;
  subscription_id: string | null;
  stripe_transfer_id: string | null;
}

export interface EarningsSummary {
  totalEarnings: number;
  subscriptionEarnings: number;
  commissionEarnings: number;
  totalNetEarnings: number;
  subscriptionNetEarnings: number;
  commissionNetEarnings: number;
}

export const useCreatorEarnings = () => {
  const { creatorProfile } = useCreatorProfile();

  const { data: earnings = [], isLoading } = useQuery({
    queryKey: ['creatorEarnings', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as CreatorEarning[];
    },
    enabled: !!creatorProfile?.id
  });

  const summary: EarningsSummary = earnings.reduce(
    (acc, earning) => {
      acc.totalEarnings += earning.amount;
      acc.totalNetEarnings += earning.net_amount;
      
      if (earning.earning_type === 'subscription') {
        acc.subscriptionEarnings += earning.amount;
        acc.subscriptionNetEarnings += earning.net_amount;
      } else if (earning.earning_type === 'commission') {
        acc.commissionEarnings += earning.amount;
        acc.commissionNetEarnings += earning.net_amount;
      }
      
      return acc;
    },
    {
      totalEarnings: 0,
      subscriptionEarnings: 0,
      commissionEarnings: 0,
      totalNetEarnings: 0,
      subscriptionNetEarnings: 0,
      commissionNetEarnings: 0,
    }
  );

  return {
    earnings,
    summary,
    isLoading
  };
};
