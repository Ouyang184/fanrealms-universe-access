import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useSellerProfile, useSellerProducts } from '@/hooks/useSellerProfile';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, CalendarDays } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SellerProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: seller, isLoading: sellerLoading, isError } = useSellerProfile(username ?? '');
  const { data: products, isLoading: productsLoading } = useSellerProducts(seller?.id ?? '');

  if (isError) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto py-20 text-center">
          <p className="text-[15px] font-semibold text-[#111]">Seller not found</p>
          <p className="text-[13px] text-[#888] mt-1">No seller with that username exists.</p>
          <Link to="/marketplace" className="inline-block mt-6 px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#3a7aab] transition-colors">
            Browse marketplace
          </Link>
        </div>
      </MainLayout>
    );
  }

  const initials = (seller?.display_name || seller?.username || '?').slice(0, 2).toUpperCase();

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start gap-5">
          {sellerLoading ? (
            <>
              <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64 mt-2" />
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-[#111] flex items-center justify-center text-white text-[18px] font-bold">
                {seller?.profile_image_url ? (
                  <img src={seller.profile_image_url} alt={seller.display_name ?? seller.username} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-[22px] font-bold tracking-[-0.5px]">
                  {seller?.display_name || seller?.username}
                </h1>
                <p className="text-[13px] text-[#888]">@{seller?.username}</p>
                {seller?.bio && (
                  <p className="text-[13px] text-[#555] mt-2 max-w-xl leading-relaxed">{seller.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-[12px] text-[#aaa]">
                    <Package className="w-3.5 h-3.5" />
                    {products?.length ?? 0} assets
                  </span>
                  {seller?.created_at && (
                    <span className="flex items-center gap-1.5 text-[12px] text-[#aaa]">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Joined {formatDistanceToNow(new Date(seller.created_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Assets */}
        <div>
          <h2 className="text-[15px] font-bold tracking-[-0.3px] mb-4">Assets</h2>
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-[#e5e5e5] rounded-2xl">
              <Package className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-[#111]">No assets listed yet</p>
              <p className="text-[12px] text-[#999] mt-1">Check back later.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
