import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useUserPurchases } from '@/hooks/useMarketplace';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/library', label: 'My Library', end: true },
  { to: '/library/reviews', label: 'Ratings & Reviews' },
  { to: '/library/recommendations', label: 'Recommendations' },
];

export function LibraryTabs() {
  return (
    <div className="border-b border-[#eee] mb-6 flex gap-6">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            cn(
              'py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors',
              isActive ? 'border-primary text-[#111]' : 'border-transparent text-[#888] hover:text-[#111]'
            )
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}

function DownloadButton({ assetUrl }: { assetUrl: string | null | undefined }) {
  if (!assetUrl) return <span className="text-[11px] text-[#aaa]">No file linked</span>;
  return (
    <a
      href={assetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
    >
      <ExternalLink className="w-3.5 h-3.5" />
      Download
    </a>
  );
}

export default function LibraryPage() {
  const { data: purchases, isLoading } = useUserPurchases();

  return (
    <DashboardLayout>
      <div className="w-full">
        <h1 className="text-[20px] font-bold tracking-[-0.5px] mb-1">My Library</h1>
        <p className="text-[13px] text-[#888] mb-6">Things you own</p>
        <LibraryTabs />

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : purchases && purchases.length > 0 ? (
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {purchases.map((p: any, i: number) => (
              <div
                key={p.id}
                className={`flex items-center gap-4 px-4 py-3.5 ${
                  i < purchases.length - 1 ? 'border-b border-[#f5f5f5]' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                  {p.digital_products?.cover_image_url && (
                    <img src={p.digital_products.cover_image_url} className="w-full h-full object-cover" alt="" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">
                    {p.digital_products?.title ?? 'Asset'}
                  </div>
                  <div className="text-[11px] text-[#aaa]">
                    by {p.creators?.display_name || p.creators?.username}
                  </div>
                </div>
                <DownloadButton assetUrl={p.digital_products?.asset_url} />
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-12 text-center">
            <ShoppingBag className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-[#111] mb-1">No purchases yet</p>
            <p className="text-[12px] text-[#999] mb-4">Browse the marketplace to find assets.</p>
            <Link
              to="/marketplace"
              className="px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#3a7aab] transition-colors"
            >
              Browse marketplace
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
