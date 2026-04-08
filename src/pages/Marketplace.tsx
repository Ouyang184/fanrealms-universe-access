import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORIES = ['all', 'Game Assets', 'Templates', 'Tools', 'Tutorials', 'Music', 'Art', 'Other'];

export default function Marketplace() {
  const [category, setCategory] = useState('all');
  const { data: products, isLoading } = useMarketplaceProducts(category);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Marketplace</h1>
          <p className="text-muted-foreground">Browse digital products from indie creators</p>
        </div>

        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="flex-wrap h-auto gap-1">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c} className="capitalize">
                {c === 'all' ? 'All' : c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No products found. Check back soon!
          </div>
        )}
      </div>
    </MainLayout>
  );
}
