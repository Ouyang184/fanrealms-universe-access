import { useEffect, useState } from 'react';
import { Wallet, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMyPayoutInfo, useSetMyPayoutInfo } from '@/hooks/useManualPayouts';
import { toast } from 'sonner';

const METHODS = ['PayPal', 'Wise', 'CashApp', 'Other'];

const DETAIL_HINT: Record<string, string> = {
  PayPal: 'PayPal email',
  Wise: 'Wise email or account',
  CashApp: '$Cashtag',
  Other: 'How should we send your payout?',
};

/**
 * Shown to creators who can't use Stripe. Lets them record a payout method so
 * the platform owner can pay them by hand. Pending earnings are sent manually.
 */
export function ManualPayoutSection() {
  const { data: info, isLoading } = useMyPayoutInfo();
  const save = useSetMyPayoutInfo();

  const hasInfo = !!info?.payout_method && !!info?.payout_details;
  const [editing, setEditing] = useState(false);
  const [method, setMethod] = useState('PayPal');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (info?.payout_method) setMethod(info.payout_method);
    if (info?.payout_details) setDetails(info.payout_details);
  }, [info?.payout_method, info?.payout_details]);

  // Start in edit mode only when nothing is saved yet.
  useEffect(() => {
    if (!isLoading && !hasInfo) setEditing(true);
  }, [isLoading, hasInfo]);

  const submit = () => {
    if (!details.trim()) {
      toast.error('Add your payout details first.');
      return;
    }
    save.mutate(
      { payout_method: method, payout_details: details.trim() },
      {
        onSuccess: () => {
          toast.success('Payout details saved.');
          setEditing(false);
        },
        onError: () => toast.error('Could not save. Please try again.'),
      },
    );
  };

  return (
    <div className="border-t border-[#f5f5f5] pt-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">
        <Wallet className="w-3 h-3" />
        Can&apos;t use Stripe?
      </div>

      {!editing && hasInfo ? (
        <div className="flex items-center justify-between gap-2 bg-[#f8fafc] border border-[#e5edf5] rounded-lg px-3 py-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#334]">
              <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
              Manual payout set
            </div>
            <div className="text-[11px] text-[#778] truncate">
              {info!.payout_method} · {info!.payout_details}
            </div>
            <div className="text-[11px] text-[#99a] mt-0.5">
              We send your pending balance by hand, usually monthly.
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-[11px] text-primary hover:underline flex-shrink-0"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-[11px] text-[#889] leading-relaxed">
            Tell us where to send your earnings and we&apos;ll pay you manually. Useful if Stripe
            isn&apos;t available in your country.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${
                  method === m
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-[#555] border-[#ddd] hover:border-[#bbb]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <Input
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={DETAIL_HINT[method] ?? 'Payout details'}
            className="text-[13px]"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={save.isPending} className="text-[12px]">
              {save.isPending ? 'Saving…' : 'Save payout details'}
            </Button>
            {hasInfo && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
                className="text-[12px]"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
