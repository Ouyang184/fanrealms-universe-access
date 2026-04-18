import { MainLayout } from '@/components/Layout/MainLayout';
import { useSellerSales } from '@/hooks/useMarketplace';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardSalesPage() {
  const { data, isLoading } = useSellerSales();

  const { sales, totals } = data ?? { sales: [], totals: { gross: 0, fees: 0, net: 0 } };

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.5px]">Sales</h1>
          <p className="text-[13px] text-[#888] mt-0.5">Your revenue overview</p>
        </div>

        {/* Stats row */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-[#eee] rounded-xl p-5">
              <div className="text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1">Gross revenue</div>
              <div className="text-[24px] font-bold tracking-[-0.5px]">{fmt(totals.gross)}</div>
              <div className="text-[11px] text-[#aaa] mt-0.5">{sales.length} sale{sales.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="bg-white border border-[#eee] rounded-xl p-5">
              <div className="text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1">Platform fees (10%)</div>
              <div className="text-[24px] font-bold tracking-[-0.5px] text-[#aaa]">{fmt(totals.fees)}</div>
            </div>
            <div className="bg-white border border-[#eee] rounded-xl p-5 border-primary/30">
              <div className="text-[11px] font-bold text-primary uppercase tracking-[0.5px] mb-1">Your earnings</div>
              <div className="text-[24px] font-bold tracking-[-0.5px] text-primary">{fmt(totals.net)}</div>
              <div className="text-[11px] text-[#aaa] mt-0.5">After platform fee</div>
            </div>
          </div>
        )}

        {/* Sales table */}
        <div>
          <h2 className="text-[15px] font-bold tracking-[-0.3px] mb-4">Transaction history</h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : sales.length > 0 ? (
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-[#f5f5f5] text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px]">
                <span>Asset</span>
                <span className="text-right">Gross</span>
                <span className="text-right">Fee</span>
                <span className="text-right">Net</span>
              </div>
              {sales.map((sale, i) => (
                <div
                  key={sale.id}
                  className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3.5 ${i < sales.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                      {(sale.digital_products as any)?.cover_image_url && (
                        <img src={(sale.digital_products as any).cover_image_url} className="w-full h-full object-cover" alt="" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate">
                        {(sale.digital_products as any)?.title ?? 'Asset'}
                      </div>
                      <div className="text-[11px] text-[#aaa]">
                        {formatDistanceToNow(new Date((sale as any).created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="text-[13px] font-semibold text-right">{fmt((sale as any).amount)}</div>
                  <div className="text-[13px] text-[#aaa] text-right">{fmt((sale as any).platform_fee)}</div>
                  <div className="text-[13px] font-bold text-primary text-right">{fmt((sale as any).net_amount)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-16 text-center">
              <TrendingUp className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-[#111] mb-1">No sales yet</p>
              <p className="text-[12px] text-[#999]">
                Publish an asset on the marketplace to start earning.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
