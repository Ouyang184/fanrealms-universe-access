import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { usePopularTags } from '@/hooks/useTags';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketplaceSidebar, PRICE_MAX_CENTS } from '@/components/marketplace/MarketplaceSidebar';
import { FeaturedSpotlight } from '@/components/marketplace/FeaturedSpotlight';
import { ProductGridDense } from '@/components/marketplace/ProductGridDense';

export default function Marketplace() {
  const [category, setCategory] = useState<string>('all');
  const [maxPriceCents, setMaxPriceCents] = useState<number>(PRICE_MAX_CENTS);
  const [sort, setSort] = useState<string>('newest');

  const { data: allProducts, isLoading } = useMarketplaceProducts(category);
  const { data: popularTags = [] } = usePopularTags(20);

  const products = useMemo(() => {
    if (!allProducts) return [];
    let list = [...allProducts];
    if (maxPriceCents < PRICE_MAX_CENTS) {
      list = list.filter((p: any) => (p.price ?? 0) <= maxPriceCents);
    }
    if (sort === 'price_asc') list.sort((a: any, b: any) => (a.price ?? 0) - (b.price ?? 0));
    if (sort === 'price_desc') list.sort((a: any, b: any) => (b.price ?? 0) - (a.price ?? 0));
    return list;
  }, [allProducts, maxPriceCents, sort]);

  const featured = products[0];
  const newest = products.slice(1, 13);
  const free = useMemo(
    () => (allProducts ?? []).filter((p: any) => (p.price ?? 0) === 0).slice(0, 8),
    [allProducts]
  );
  const topPicks = useMemo(
    () => (allProducts ?? []).filter((p: any) => (p.price ?? 0) > 0).slice(0, 8),
    [allProducts]
  );

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        {/* Slim info strip */}
        <div className="text-[12.5px] text-muted-foreground border-b border-border pb-3">
          FanRealms is a marketplace for indie creators — keep 95% of every sale.{' '}
          <Link to="/dashboard/assets" className="text-primary hover:underline font-medium">
            Upload an asset
          </Link>
          {' · '}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Create an account
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
          <MarketplaceSidebar
            category={category}
            maxPriceCents={maxPriceCents}
            sort={sort}
            popularTags={popularTags}
            onCategory={setCategory}
            onMaxPriceCents={setMaxPriceCents}
            onSort={setSort}
          />

          <main className="space-y-10 min-w-0">
            {isLoading ? (
              <LoadingState />
            ) : products.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {featured && <FeaturedSpotlight product={featured as any} />}

                {newest.length > 0 && (
                  <SectionBlock
                    title={category === 'all' ? 'New & noteworthy' : category}
                    meta={`${products.length} ${products.length === 1 ? 'asset' : 'assets'}`}
                  >
                    <ProductGridDense products={newest as any} />
                  </SectionBlock>
                )}

                {topPicks.length > 0 && (
                  <SectionBlock title="Top picks" meta="Paid assets">
                    <ProductGridDense products={topPicks as any} />
                  </SectionBlock>
                )}

                {free.length > 0 && (
                  <SectionBlock title="Free this week" meta="No cost · grab and go">
                    <ProductGridDense products={free as any} />
                  </SectionBlock>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </MainLayout>
  );
}

function SectionBlock({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-border pb-2 mb-4">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-foreground">
          {title}
        </h2>
        {meta && <span className="text-[11px] text-muted-foreground">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-border bg-card p-10 text-center">
      <h3 className="text-[18px] font-bold mb-2">No assets match these filters</h3>
      <p className="text-[13px] text-muted-foreground mb-5">
        Try clearing the price or category filter — or be the first to upload an asset in this category.
      </p>
      <Link
        to="/dashboard/assets"
        className="inline-flex items-center px-4 h-9 bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors"
      >
        Upload an asset
      </Link>
    </div>
  );
}
