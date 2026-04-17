import { useSearchParams } from 'react-router-dom';
import { MarketplaceLayout } from '@/components/Layout/MarketplaceLayout';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { ShoppingBag, TrendingUp, Sparkles, Star } from 'lucide-react';

const CATEGORIES = ['all', 'Game Assets', 'Templates', 'Tools', 'Tutorials', 'Music', 'Art', 'Other'];

export default function Marketplace() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const { data: products, isLoading } = useMarketplaceProducts(category);

  const setCategory = (c: string) => {
    const next = new URLSearchParams(params);
    if (c === 'all') next.delete('category');
    else next.set('category', c);
    setParams(next);
  };

  // Simple sections derived from same dataset for the storefront feel
  const all = products ?? [];
  const trending = all.slice(0, 4);
  const fresh = [...all].sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 4);
  const featured = all.slice(0, 8);

  const showSections = category === 'all' && !isLoading && all.length > 0;

  return (
    <MarketplaceLayout>
      {/* HERO STRIP */}
      <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {category === 'all' ? 'The indie marketplace' : category}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xl text-sm sm:text-base">
                {category === 'all'
                  ? 'Game assets, tools, templates, music and art — built by indie creators.'
                  : `Browse ${category.toLowerCase()} from indie creators on FanRealms.`}
              </p>
            </div>
            <Link
              to="/creator-studio/products"
              className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity self-start md:self-auto"
            >
              Sell something
            </Link>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap mt-6">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  category === c
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : all.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card border border-border rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold mb-2">No assets listed yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
              Be the first creator to sell game art, templates, tools, or music on FanRealms.
            </p>
            <Link
              to="/signup"
              className="px-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity"
            >
              Start selling
            </Link>
          </div>
        ) : showSections ? (
          <>
            {/* Trending */}
            <section>
              <SectionHeader Icon={TrendingUp} title="Trending now" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {trending.map((p: any) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>

            {/* Fresh */}
            <section>
              <SectionHeader Icon={Sparkles} title="Fresh releases" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {fresh.map((p: any) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>

            {/* All */}
            <section>
              <SectionHeader Icon={Star} title="All assets" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {featured.map((p: any) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          </>
        ) : (
          // Filtered single-grid view
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {all.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </MarketplaceLayout>
  );
}

function SectionHeader({ Icon, title }: { Icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
    </div>
  );
}
