import { ShieldCheck, ShieldAlert, ShieldQuestion, Loader2 } from 'lucide-react';
import { SCAN_LABELS, type ScanStatus } from '@/lib/scan';

const STYLES: Record<ScanStatus, string> = {
  pending: 'bg-muted text-muted-foreground border-border',
  clean: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  infected: 'bg-destructive/10 text-destructive border-destructive/30',
  error: 'bg-amber-50 text-amber-700 border-amber-200',
  unscannable: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function ScanStatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const s = (status as ScanStatus) in SCAN_LABELS ? (status as ScanStatus) : 'pending';
  const Icon =
    s === 'clean' ? ShieldCheck : s === 'infected' ? ShieldAlert : s === 'pending' ? Loader2 : ShieldQuestion;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STYLES[s]}`}
    >
      <Icon className={`h-3 w-3 ${s === 'pending' ? 'animate-spin' : ''}`} />
      {SCAN_LABELS[s]}
    </span>
  );
}
