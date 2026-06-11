// src/hooks/useCreatorEarnings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface EarningRow {
  id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  earning_type: string;
  status: 'pending' | 'transferred' | 'failed';
  created_at: string;
}

export interface EarningsSummary {
  pendingBalance: number;
  totalEarned: number;
  recentEarnings: EarningRow[];
}

export function useCreatorEarnings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['creator-earnings', user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60,
    queryFn: async (): Promise<EarningsSummary> => {
      const { data: creator, error: creatorErr } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (creatorErr) throw creatorErr;
      if (!creator) return { pendingBalance: 0, totalEarned: 0, recentEarnings: [] };

      const { data: earnings, error } = await supabase
        .from('creator_earnings')
        .select('id, amount, platform_fee, net_amount, earning_type, status, created_at')
        .eq('creator_id', creator.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (earnings ?? []) as EarningRow[];
      const pendingBalance = rows
        .filter((e) => e.status === 'pending')
        .reduce((sum, e) => sum + Number(e.net_amount), 0);
      const totalEarned = rows
        .filter((e) => e.status === 'transferred')
        .reduce((sum, e) => sum + Number(e.net_amount), 0);

      return {
        pendingBalance,
        totalEarned,
        recentEarnings: rows.slice(0, 5),
      };
    },
  });
}

export function useTransferPendingEarnings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { action: 'transfer_pending_earnings' },
      });
      if (error) throw error;
      return data as { transferred: number; amount: number; transferId?: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-earnings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['stripeConnectStatus', user?.id] });
    },
  });
}

export function useCreatorFeeRate() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['creator-fee-rate', user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<number> => {
      // platform_fee_rate is revoked from anon/authenticated on the creators
      // table; use the SECURITY DEFINER RPC that returns only the caller's rate.
      const { data, error } = await supabase.rpc('get_creator_fee_rate');
      if (error) throw error;
      return (data as number | null) ?? 5;
    },
  });
}

export function useUpdateCreatorFeeRate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rate: number) => {
      if (rate < 1 || rate > 5) throw new Error('Fee rate must be between 1 and 5');
      const { error } = await supabase
        .from('creators')
        .update({ platform_fee_rate: rate })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-fee-rate', user?.id] });
    },
  });
}
