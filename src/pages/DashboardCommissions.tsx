import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useCommissionRequests } from '@/hooks/useCommissionRequests';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { safeHref } from '@/lib/safeHref';

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-800',
  accepted:    'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed:   'bg-green-100 text-green-800',
  rejected:    'bg-red-100 text-red-600',
  cancelled:   'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  pending:     'Pending',
  accepted:    'Accepted',
  in_progress: 'In Progress',
  completed:   'Completed',
  rejected:    'Rejected',
  cancelled:   'Cancelled',
};

const NEXT_STATUSES: Record<string, string[]> = {
  accepted:    ['in_progress', 'rejected'],
  in_progress: ['completed', 'rejected'],
};

function RequestCard({
  request,
  onAccept,
  onReject,
  onUpdateStatus,
  isUpdating,
}: {
  request: any;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  isUpdating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPending = request.status === 'pending';
  const nextStatuses = NEXT_STATUSES[request.status] ?? [];

  const budgetDisplay = () => {
    if (request.budget_range_min && request.budget_range_max)
      return `$${request.budget_range_min} – $${request.budget_range_max}`;
    if (request.agreed_price) return `$${request.agreed_price} agreed`;
    if (request.budget_range_min) return `From $${request.budget_range_min}`;
    return 'No budget specified';
  };

  return (
    <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Customer avatar */}
        <div className="w-9 h-9 rounded-full bg-[#f0f0f0] flex-shrink-0 overflow-hidden flex items-center justify-center text-[13px] font-bold text-[#888]">
          {request.customer?.profile_picture ? (
            <img src={request.customer.profile_picture} alt="" className="w-full h-full object-cover" />
          ) : (
            (request.customer?.username ?? '?').slice(0, 1).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[13px] font-semibold text-[#111]">{request.title}</p>
              <p className="text-[11px] text-[#888]">
                from @{request.customer?.username ?? 'unknown'} ·{' '}
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[request.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {STATUS_LABELS[request.status] ?? request.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            {request.commission_type && (
              <span className="text-[11px] text-[#666]">
                {request.commission_type.name}
              </span>
            )}
            <span className="text-[11px] font-semibold text-primary">{budgetDisplay()}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="p-1 text-[#bbb] hover:text-[#555] transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#f5f5f5] pt-3">
          <div>
            <p className="text-[11px] font-semibold text-[#aaa] uppercase tracking-wide mb-1">Description</p>
            <p className="text-[13px] text-[#444] whitespace-pre-wrap">{request.description}</p>
          </div>

          {request.customer_notes && (
            <div>
              <p className="text-[11px] font-semibold text-[#aaa] uppercase tracking-wide mb-1">Customer notes</p>
              <p className="text-[13px] text-[#444] whitespace-pre-wrap">{request.customer_notes}</p>
            </div>
          )}

          {request.reference_images?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#aaa] uppercase tracking-wide mb-2">Reference images</p>
              <div className="flex flex-wrap gap-2">
                {request.reference_images.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-[#eee] hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => onAccept(request.id)}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => onReject(request.id)}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Decline
                </button>
              </>
            )}

            {nextStatuses.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => onUpdateStatus(request.id, s)}
                disabled={isUpdating}
                className="px-3 py-1.5 text-[12px] font-semibold border border-[#ddd] text-[#444] hover:border-[#aaa] rounded-lg transition-colors disabled:opacity-50"
              >
                Mark as {STATUS_LABELS[s] ?? s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const FILTER_TABS = [
  { key: 'active',    label: 'Active' },
  { key: 'pending',   label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'all',       label: 'All' },
] as const;

type Filter = typeof FILTER_TABS[number]['key'];

const ACTIVE_STATUSES = new Set(['accepted', 'in_progress']);

export default function DashboardCommissionsPage() {
  const { requests, isLoading, acceptRequest, rejectRequest, updateRequestStatus, isUpdating } = useCommissionRequests();
  const [filter, setFilter] = useState<Filter>('active');

  const filtered = requests.filter((r: any) => {
    if (filter === 'active')    return ACTIVE_STATUSES.has(r.status);
    if (filter === 'pending')   return r.status === 'pending';
    if (filter === 'completed') return r.status === 'completed';
    return true;
  });

  const pendingCount = requests.filter((r: any) => r.status === 'pending').length;

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-bold tracking-[-0.5px]">Commission Requests</h1>
          {pendingCount > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800">
              {pendingCount} pending
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-[#eee]">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
                filter === tab.key
                  ? 'border-primary text-[#111]'
                  : 'border-transparent text-[#888] hover:text-[#111]'
              }`}
            >
              {tab.label}
              {tab.key === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 text-[10px] font-bold bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-12 text-center">
            <p className="text-[15px] font-semibold text-[#111] mb-1">No requests here</p>
            <p className="text-[13px] text-[#999]">
              {filter === 'pending'
                ? "No pending requests — you're all caught up."
                : filter === 'active'
                ? 'No active commissions right now.'
                : 'Commission requests will appear here once customers submit them.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r: any) => (
              <RequestCard
                key={r.id}
                request={r}
                onAccept={acceptRequest}
                onReject={rejectRequest}
                onUpdateStatus={updateRequestStatus}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
