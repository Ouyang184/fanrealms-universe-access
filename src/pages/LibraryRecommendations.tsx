import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LibraryTabs } from './Library';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { Skeleton } from '@/components/ui/skeleton';

export default function LibraryRecommendationsPage() {
  const { data: products, isLoading } = useMarketplaceProducts();

  const recommendations = (products ?? []).slice(0, 12);

  return (
    <DashboardLayout>
      <div className="w-full">
        <h1 className="text-[20px] font-bold tracking-[-0.5px] mb-1">My Library</h1>
        <p className="text-[13px] text-[#888] mb-6">Recommendations</p>
        <LibraryTabs />

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recommendations.map((p: any) => (
              <Link key={p.id} to={`/marketplace/${p.id}`} className="group">
                <div className="aspect-[4/3] rounded-xl bg-[#f5f5f5] overflow-hidden mb-2">
                  {p.cover_image_url && (
                    <img src={p.cover_image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                  )}
                </div>
                <div className="text-[13px] font-semibold truncate">{p.title}</div>
                <div className="text-[11px] text-[#aaa]">{p.creators?.display_name || p.creators?.username}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
