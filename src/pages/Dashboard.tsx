import { Link, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useCreatorProducts, useSellerSales } from '@/hooks/useMarketplace';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Upload } from 'lucide-react';
import { EarningsCard } from '@/components/dashboard/EarningsCard';
import { useTransferPendingEarnings } from '@/hooks/useCreatorEarnings';
import { toast } from 'sonner';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-[#eee] rounded-xl p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa] mb-1">{label}</div>
      <div className="text-[28px] font-bold tracking-[-0.5px] text-[#111]">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: myAssets, isLoading: assetsLoading } = useCreatorProducts();
  const { data: salesData, isLoading: salesLoading } = useSellerSales();
  const [searchParams, setSearchParams] = useSearchParams();
  const transferMutation = useTransferPendingEarnings();

  // Handle redirect back from Stripe Connect onboarding
  useEffect(() => {
    if (searchParams.get('stripe_success') !== 'true') return;
    setSearchParams({}, { replace: true });
    transferMutation.mutateAsync()
      .then((result) => {
        if (result.transferred > 0) {
          toast.success(`Stripe connected! $${result.amount.toFixed(2)} transferred to your account.`);
        } else {
          toast.success('Stripe connected! Future earnings will be paid automatically.');
        }
      })
      .catch(() => {
        toast.info('Stripe connected! Your pending earnings will be transferred shortly.');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publishedCount = myAssets?.filter((a) => (a as any).status === 'published').length ?? 0;
  const salesCount = salesData?.sales.length ?? 0;
  const totalEarnings = salesData?.totals.net ?? 0;
  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const recentSales = salesData?.sales.slice(0, 5) ?? [];

  return (
    <DashboardLayout>
      <div className="w-full space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-bold tracking-[-0.5px]">Dashboard</h1>
          <Link
            to="/dashboard/assets/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#3a7aab] transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload an asset
          </Link>
        </div>

        {/* Stats */}
        {salesLoading || assetsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Published assets" value={publishedCount} />
            <StatCard label="Total sales" value={salesCount} />
            <StatCard label="Total earnings" value={fmt(totalEarnings)} />
          </div>
        )}

        {/* Earnings */}
        <EarningsCard />

        {/* Your assets */}
        <section>
          <h2 className="text-[15px] font-bold tracking-[-0.3px] mb-4">Your Assets</h2>
          {assetsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (myAssets ?? []).length > 0 ? (
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              {(myAssets ?? []).map((a, i) => (
                <Link
                  key={(a as any).id}
                  to={`/dashboard/assets/${(a as any).id}`}
                  className={`flex items-center gap-4 px-4 py-3 hover:bg-[#fafafa] transition-colors ${
                    i < (myAssets ?? []).length - 1 ? 'border-b border-[#f5f5f5]' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                    {(a as any).cover_image_url && (
                      <img
                        src={(a as any).cover_image_url}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{(a as any).title}</div>
                    <div className="text-[11px] text-[#aaa]">{(a as any).category}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      (a as any).status === 'published'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-[#f5f5f5] text-[#888] border border-[#ddd]'
                    }`}
                  >
                    {(a as any).status === 'published' ? 'LIVE' : 'DRAFT'}
                  </span>
                  <div className="text-[13px] font-semibold text-[#333] w-16 text-right">
                    {(a as any).price === 0 ? 'Free' : `$${Number((a as any).price).toFixed(2)}`}
                  </div>
                </Link>
              ))}
              <div className="px-4 py-3 border-t border-[#f5f5f5]">
                <Link
                  to="/dashboard/assets/new"
                  className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New asset
                </Link>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-[#e5e5e5] rounded-2xl py-16 px-8 text-center">
              <p className="text-[22px] font-bold tracking-[-0.5px] text-[#111] mb-2">
                Ready to share your work?
              </p>
              <p className="text-[14px] text-[#888] mb-8">
                Upload your first Godot asset and start selling.
              </p>
              <Link
                to="/dashboard/assets/new"
                className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold text-white bg-primary rounded-lg hover:bg-[#3a7aab] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Upload an asset
              </Link>
              <div className="mt-4">
                <Link
                  to="/marketplace"
                  className="text-[13px] text-[#aaa] hover:text-[#555] hover:underline transition-colors"
                >
                  Browse the marketplace →
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Recent sales — only shown if there are sales */}
        {salesCount > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold tracking-[-0.3px]">Recent sales</h2>
              <Link to="/dashboard/sales" className="text-[13px] font-semibold text-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              {recentSales.map((s: any, i: number) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-4 px-4 py-3 ${
                    i < recentSales.length - 1 ? 'border-b border-[#f5f5f5]' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">
                      {(s.digital_products as any)?.title ?? 'Asset'}
                    </div>
                  </div>
                  <div className="text-[13px] font-semibold text-primary">{fmt(s.net_amount ?? 0)}</div>
                  <div className="text-[11px] text-[#aaa]">
                    {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </DashboardLayout>
  );
}
