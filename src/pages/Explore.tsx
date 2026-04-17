import { MainLayout } from "@/components/Layout/MainLayout";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useMarketplaceProducts } from "@/hooks/useMarketplace";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { FilterSidebar } from "@/components/marketplace/FilterSidebar";
import { CategoryTileGrid } from "@/components/marketplace/CategoryTileGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid, List, ShoppingBag } from "lucide-react";

export default function ExplorePage() {
  const [params] = useSearchParams();
  const category = params.get("category") || "all";
  const price = params.get("price") || "all";
  const sort = params.get("sort") || "popular";
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: products, isLoading } = useMarketplaceProducts(category);

  useEffect(() => {
    document.title = "Explore | FanRealms Marketplace";
  }, []);

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (price === "free") list = list.filter((p: any) => p.price === 0);
    if (price === "paid") list = list.filter((p: any) => p.price > 0);
    if (sort === "new") {
      list = [...list].sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === "price-asc") {
      list = [...list].sort((a: any, b: any) => a.price - b.price);
    } else if (sort === "price-desc") {
      list = [...list].sort((a: any, b: any) => b.price - a.price);
    }
    return list;
  }, [products, price, sort]);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <MarketplaceHero
          title="Explore the marketplace"
          subtitle="Filter by category, price, and rating to find what you need."
        />

        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Browse by category
          </h2>
          <CategoryTileGrid />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <FilterSidebar className="lg:sticky lg:top-20 lg:self-start" />

          <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="text-sm text-muted-foreground">
                {isLoading ? "Loading..." : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
              </div>
              <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-card">
                <button
                  onClick={() => setView("grid")}
                  className={`p-1.5 rounded ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-1.5 rounded ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-2 md:grid-cols-3 gap-4"
                    : "grid grid-cols-1 gap-3"
                }
              >
                {filtered.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                  <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">No results</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                  Try adjusting your filters or browse all categories.
                </p>
                <Link
                  to="/explore"
                  className="px-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity"
                >
                  Reset filters
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
