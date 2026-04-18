import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useUserPurchases, useCreatorProducts } from '@/hooks/useMarketplace';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Package, Plus, ExternalLink } from 'lucide-react';

function DownloadButton({ assetUrl }: { assetUrl: string | null | undefined }) {
  if (!assetUrl) {
    return <span className="text-[11px] text-[#aaa]">No file linked</span>;
  }
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

export default function DashboardPage() {
  const { data: purchases, isLoading: purchasesLoading } = useUserPurchases();
  const { data: myAssets, isLoading: assetsLoading } = useCreatorProducts();

  const publishedAssets = myAssets?.filter((a) => a.status === 'published') ?? [];

  return (
    <MainLayout>
      <div className="w-full space-y-10">
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.5px]">Dashboard</h1>
          <p className="text-[13px] text-[#888] mt-0.5">Your purchases and listings</p>
        </div>

        {/* Purchases */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold tracking-[-0.3px]">Purchases</h2>
            <Link to="/marketplace" className="text-[13px] font-semibold text-primary hover:underline">
              Browse marketplace
            </Link>
          </div>

          {purchasesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : purchases && purchases.length > 0 ? (
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              {purchases.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 px-4 py-3.5 ${i < purchases.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                    {(p.digital_products as any)?.cover_image_url && (
                      <img
                        src={(p.digital_products as any).cover_image_url}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">
                      {(p.digital_products as any)?.title ?? 'Asset'}
                    </div>
                    <div className="text-[11px] text-[#aaa]">
                      by {(p.creators as any)?.display_name || (p.creators as any)?.username}
                    </div>
                  </div>
                  <DownloadButton assetUrl={(p.digital_products as any)?.asset_url} />
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-10 text-center">
              <ShoppingBag className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-[#111] mb-1">No purchases yet</p>
              <p className="text-[12px] text-[#999] mb-4">Browse the marketplace to find Godot assets.</p>
              <Link
                to="/marketplace"
                className="px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#3a7aab] transition-colors"
              >
                Browse marketplace
              </Link>
            </div>
          )}
        </section>

        {/* My assets */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold tracking-[-0.3px]">Your Assets</h2>
            <Link to="/dashboard/assets" className="text-[13px] font-semibold text-primary hover:underline">
              Manage all
            </Link>
          </div>

          {assetsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : publishedAssets.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {publishedAssets.slice(0, 4).map((a) => (
                <ProductCard key={a.id} product={a} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-10 text-center">
              <Package className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-[#111] mb-1">No assets listed yet</p>
              <p className="text-[12px] text-[#999] mb-4">Upload your first Godot asset and start selling.</p>
              <Link
                to="/dashboard/assets"
                className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#3a7aab] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Upload an asset
              </Link>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
