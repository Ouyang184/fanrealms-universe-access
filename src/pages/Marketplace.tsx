import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

const CATEGORIES = ['all', 'Game Assets', 'Templates', 'Tools', 'Tutorials', 'Music', 'Art', 'Other'];

export default function Marketplace() {
  const [category, setCategory] = useState('all');
  const { data: products, isLoading } = useMarketplaceProducts(category);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.5px]">Marketplace</h1>
            <p className="text-[13px] text-[#888] mt-0.5">Buy digital assets from indie creators</p>
          </div>
          <Link
            to="/creator-studio/products"
            className="px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#be123c] transition-colors"
          >
            Sell something
          </Link>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                category === c
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#ccc]'
              }`}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center mb-4">
              <ShoppingBag className="w-5 h-5 text-[#aaa]" />
            </div>
            <h3 className="text-[17px] font-bold text-[#111] mb-2">No assets listed yet</h3>
            <p className="text-[13px] text-[#888] max-w-xs mb-6 leading-relaxed">
              Be the first creator to sell game art, templates, tools, or music on FanRealms.
            </p>
            <Link
              to="/signup"
              className="px-5 py-2.5 text-[13px] font-semibold text-white bg-primary rounded-[10px] hover:bg-[#be123c] transition-colors"
            >
              Start selling
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
