// Manual (non-Stripe) payouts.
// Lets creators who cannot use Stripe record a payout method (PayPal, Wise,
// CashApp, etc.) and lets the platform owner see who is owed and mark paid.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface MyPayoutInfo {
  payout_method: string | null;
  payout_details: string | null;
}

export interface PendingPayoutRow {
  creator_id: string;
  display_name: string | null;
  username: string | null;
  payout_method: string | null;
  payout_details: string | null;
  pending_total: number;
  pending_count: number;
  oldest_pending: string;
}

/** The current creator's saved payout method/details (read via SECURITY DEFINER RPC). */
export function useMyPayoutInfo() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-payout-info', user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60,
    queryFn: async (): Promise<MyPayoutInfo> => {
      const { data, error } = await (supabase as any).rpc('get_my_payout_info');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        payout_method: row?.payout_method ?? null,
        payout_details: row?.payout_details ?? null,
      };
    },
  });
}

/** Save the current creator's payout method/details. */
export function useSetMyPayoutInfo() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { payout_method: string; payout_details: string }) => {
      const { error } = await supabase
        .from('creators')
        .update({
          payout_method: input.payout_method,
          payout_details: input.payout_details,
        })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-payout-info', user?.id] });
    },
  });
}

/** Admin: list creators owed a manual payout (pending earnings, no Stripe). */
export function useAdminPendingPayouts(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-pending-payouts'],
    enabled,
    staleTime: 1000 * 30,
    queryFn: async (): Promise<PendingPayoutRow[]> => {
      const { data, error } = await (supabase as any).rpc('admin_list_pending_payouts');
      if (error) throw error;
      return ((data ?? []) as any[]).map((r) => ({
        creator_id: r.creator_id,
        display_name: r.display_name,
        username: r.username,
        payout_method: r.payout_method,
        payout_details: r.payout_details,
        pending_total: Number(r.pending_total),
        pending_count: Number(r.pending_count),
        oldest_pending: r.oldest_pending,
      }));
    },
  });
}

/** Admin: mark a creator's pending earnings as paid (after sending money). */
export function useAdminMarkPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (creatorId: string) => {
      const { data, error } = await (supabase as any).rpc('admin_mark_payouts_paid', {
        p_creator_id: creatorId,
      });
      if (error) throw error;
      return Number(data ?? 0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-payouts'] });
    },
  });
}
