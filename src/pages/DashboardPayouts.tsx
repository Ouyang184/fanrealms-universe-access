import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Wallet, Copy, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';
import { useIsAdmin } from '@/hooks/useJam';
import { useAdminPendingPayouts, useAdminMarkPaid, type PendingPayoutRow } from '@/hooks/useManualPayouts';

const fmt = (n: number) => `$${n.toFixed(2)}`;

export default function DashboardPayoutsPage() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: rows, isLoading } = useAdminPendingPayouts(!!isAdmin);

  if (adminLoading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-40 rounded-xl" />
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-16 text-center">
          <p className="text-[14px] font-semibold text-[#111] mb-1">Not available</p>
          <p className="text-[12px] text-[#999]">This page is for the platform owner only.</p>
        </div>
      </DashboardLayout>
    );
  }

  const total = (rows ?? []).reduce((s, r) => s + r.pending_total, 0);

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.5px]">Manual payouts</h1>
          <p className="text-[13px] text-[#888] mt-0.5">
            Creators who can&apos;t use Stripe. Send their balance by hand, then mark it paid.
          </p>
        </div>

        <div className="bg-[#f8fafc] border border-[#e5edf5] rounded-xl p-4 text-[13px] text-[#445] leading-relaxed">
          <p className="mb-1"><strong>How this works:</strong> the money is already in your Stripe
          balance. Send each creator their pending total using their payout method below, then click
          <strong> Mark as paid</strong> to clear it from this list.</p>
          <p className="text-[12px] text-[#778]">Only creators without Stripe Connect appear here.</p>
        </div>

        {isLoading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : (rows ?? []).length > 0 ? (
          <>
            <div className="text-[13px] text-[#555]">
              <span className="font-semibold text-[#111]">{fmt(total)}</span> owed across{' '}
              {rows!.length} creator(s)
            </div>
            <div className="space-y-3">
              {rows!.map((r) => (
                <PayoutRow key={r.creator_id} row={r} />
              ))}
            </div>
          </>
        ) : (
          <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-16 text-center">
            <Wallet className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-[#111] mb-1">Nothing owed</p>
            <p className="text-[12px] text-[#999]">
              No non-Stripe creators have pending earnings right now.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function PayoutRow({ row }: { row: PendingPayoutRow }) {
  const markPaid = useAdminMarkPaid();
  const [copied, setCopied] = useState(false);

  const name = row.display_name || row.username || 'Creator';
  const hasPayout = !!row.payout_method && !!row.payout_details;

  const copy = async () => {
    if (!row.payout_details) return;
    try {
      await navigator.clipboard.writeText(row.payout_details);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy.');
    }
  };

  const handleMarkPaid = () => {
    if (!confirm(`Mark ${fmt(row.pending_total)} to ${name} as paid? Do this only after you have sent the money.`)) return;
    markPaid.mutate(row.creator_id, {
      onSuccess: (n) => toast.success(`Marked ${n} earning(s) paid for ${name}.`),
      onError: () => toast.error('Could not mark paid. Please try again.'),
    });
  };

  return (
    <div className="bg-white border border-[#eee] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold truncate">{name}</div>
        <div className="text-[11px] text-[#aaa]">
          {row.pending_count} earning(s) · oldest{' '}
          {formatDistanceToNow(new Date(row.oldest_pending), { addSuffix: true })}
        </div>
        {hasPayout ? (
          <div className="mt-2 inline-flex items-center gap-2 bg-[#f8fafc] border border-[#e5edf5] rounded-lg px-2.5 py-1.5">
            <span className="text-[12px] font-semibold text-[#334]">{row.payout_method}</span>
            <span className="text-[12px] text-[#556] truncate max-w-[220px]">{row.payout_details}</span>
            <button onClick={copy} className="text-[#888] hover:text-primary flex-shrink-0" title="Copy">
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        ) : (
          <div className="mt-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 inline-block">
            No payout method set yet — ask them to add one in their dashboard.
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
        <div className="text-[20px] font-bold tracking-[-0.5px] text-primary">{fmt(row.pending_total)}</div>
        <Button
          size="sm"
          onClick={handleMarkPaid}
          disabled={markPaid.isPending || !hasPayout}
          className="text-[12px]"
        >
          {markPaid.isPending ? 'Saving…' : 'Mark as paid'}
        </Button>
      </div>
    </div>
  );
}
