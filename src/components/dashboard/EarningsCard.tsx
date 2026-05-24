import { formatDistanceToNow } from 'date-fns';
import { DollarSign, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreatorEarnings, useTransferPendingEarnings } from '@/hooks/useCreatorEarnings';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

function useCreatorId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-creator-id', user?.id],
    enabled: !!user?.id,
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data?.id ?? null;
    },
  });
}

const fmt = (n: number) => `$${n.toFixed(2)}`;

export function EarningsCard() {
  const { data: summary, isLoading } = useCreatorEarnings();
  const { connectStatus, createConnectAccount, createLoginLink, isLoading: connectLoading } = useStripeConnect();
  const { data: creatorId } = useCreatorId();
  const transferMutation = useTransferPendingEarnings();

  const isConnected = !!connectStatus?.stripe_charges_enabled;
  const hasPending = (summary?.pendingBalance ?? 0) > 0;

  const handleConnect = () => {
    if (!creatorId) return;
    createConnectAccount(creatorId);
  };

  const handleTransfer = async () => {
    try {
      const result = await transferMutation.mutateAsync();
      if (result.transferred > 0) {
        toast.success(`$${result.amount.toFixed(2)} transferred to your Stripe account!`);
      } else {
        toast.info('No pending earnings to transfer.');
      }
    } catch {
      toast.error('Transfer failed. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-[#eee] rounded-xl p-5 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#eee] rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">
          Earnings
        </div>
        {isConnected && (
          <button
            onClick={createLoginLink}
            disabled={connectLoading}
            className="flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            Stripe Dashboard
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Balance row */}
      <div className="flex gap-6">
        <div>
          <div className="text-[11px] text-[#aaa] mb-0.5">Pending</div>
          <div className="text-[22px] font-bold tracking-[-0.5px] text-[#111]">
            {fmt(summary?.pendingBalance ?? 0)}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-[#aaa] mb-0.5">Paid out</div>
          <div className="text-[22px] font-bold tracking-[-0.5px] text-[#111]">
            {fmt(summary?.totalEarned ?? 0)}
          </div>
        </div>
      </div>

      {/* Connect banner or transfer button */}
      {!isConnected ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-amber-800">
              {hasPending
                ? `Connect Stripe to receive ${fmt(summary?.pendingBalance ?? 0)}`
                : 'Connect Stripe to receive future payouts'}
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Takes ~2 minutes. Stripe Express account.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={connectLoading || !creatorId}
            className="flex-shrink-0 text-[11px]"
          >
            Connect
          </Button>
        </div>
      ) : hasPending ? (
        <Button
          size="sm"
          onClick={handleTransfer}
          disabled={transferMutation.isPending}
          className="w-full"
        >
          <DollarSign className="w-3.5 h-3.5 mr-1.5" />
          {transferMutation.isPending
            ? 'Transferring…'
            : `Transfer ${fmt(summary?.pendingBalance ?? 0)} to Stripe`}
        </Button>
      ) : null}

      {/* Recent earnings */}
      {(summary?.recentEarnings ?? []).length > 0 && (
        <div className="border-t border-[#f5f5f5] pt-3 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">
            Recent
          </div>
          {summary!.recentEarnings.map((e) => (
            <div key={e.id} className="flex items-center justify-between">
              <span className="text-[12px] text-[#555]">
                {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  e.status === 'transferred'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {e.status === 'transferred' ? 'paid' : 'pending'}
                </span>
                <span className="text-[13px] font-semibold text-[#111]">
                  {fmt(Number(e.net_amount))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
