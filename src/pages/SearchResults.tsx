
import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useCreators } from "@/hooks/useCreators";
import { useProductSearch } from "@/hooks/useMarketplace";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowLeft, Package } from "lucide-react";
import { NSFWBadge } from "@/components/ui/nsfw-badge";
import { CreatorProfile } from "@/types";

function ProductCard({ product }: { product: any }) {
  const creator = product.creators;
  const isFree = !product.price || Number(product.price) === 0;

  return (
    <Link to={`/marketplace/${product.id}`}>
      <Card className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-[#ddd] transition-all h-full">
        <div className="aspect-[4/3] bg-[#f5f5f5] overflow-hidden">
          {product.cover_image_url ? (
            <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-[#ccc]" />
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-1">
          <p className="text-[13px] font-semibold text-[#111] line-clamp-1">{product.title}</p>
          {creator && (
            <p className="text-[11px] text-[#999]">
              by {creator.display_name || creator.username}
            </p>
          )}
          <div className="flex items-center justify-between pt-1">
            {product.category && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#666]">
                {product.category}
              </span>
            )}
            <span className="text-[13px] font-bold text-primary ml-auto">
              {isFree ? 'Free' : `$${Number(product.price).toFixed(2)}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CreatorCard({ creator }: { creator: CreatorProfile }) {
  const displayName = creator.displayName || creator.display_name || creator.username || "Creator";
  const avatarUrl = creator.profile_image_url || creator.avatar_url;
  const creatorLink = creator.username ? `/${creator.username}` : `/${creator.id}`;

  return (
    <Card className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
      <div className="h-20 bg-[#f5f5f5] relative">
        {creator.banner_url && (
          <img src={creator.banner_url} alt={displayName} className="w-full h-full object-cover" />
        )}
        {creator.is_nsfw && (
          <div className="absolute top-2 left-2">
            <NSFWBadge variant="card" />
          </div>
        )}
      </div>
      <CardContent className="pt-0 -mt-10 px-4 pb-4">
        <Avatar className="h-16 w-16 border-[4px] border-white">
          <AvatarImage src={avatarUrl || '/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png'} alt={displayName} />
          <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <h3 className="text-[15px] font-bold text-[#111] mt-2">{displayName}</h3>
        <p className="text-[#666] text-[12px] mt-0.5 line-clamp-2">{creator.bio || "Seller on FanRealms"}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-[#aaa]">{creator.follower_count || 0} followers</span>
          <Button asChild className="bg-primary hover:bg-[#3a7aab]" size="sm">
            <Link to={creatorLink}>View shop</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array(count).fill(0).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const trimmed = searchQuery.trim();
  const hasQuery = trimmed.length >= 2;

  const { data: creators = [], isLoading: creatorsLoading } = useCreators(trimmed);
  const { data: products = [], isLoading: productsLoading } = useProductSearch(trimmed);

  const isLoading = creatorsLoading || productsLoading;
  const totalResults = creators.length + products.length;

  useEffect(() => {
    document.title = searchQuery
      ? `"${searchQuery}" — Search Results | FanRealms`
      : "Search Results | FanRealms";
  }, [searchQuery]);

  return (
    <MainLayout fullWidth>
      <div className="w-full space-y-8">
        {/* Header */}
        <div>
          <Link to="/marketplace">
            <Button variant="ghost" className="mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <Search className="h-6 w-6 text-[#aaa]" />
            <h1 className="text-[26px] font-bold text-[#111]">
              {searchQuery ? `"${searchQuery}"` : "Search Results"}
            </h1>
          </div>
          {hasQuery && !isLoading && (
            <p className="text-[13px] text-[#999] ml-9">
              {totalResults} result{totalResults !== 1 ? 's' : ''} —{' '}
              {products.length} asset{products.length !== 1 ? 's' : ''},{' '}
              {creators.length} seller{creators.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* No query state */}
        {!searchQuery && (
          <div className="text-center py-20">
            <Search className="h-16 w-16 mx-auto mb-4 text-[#bbb]" />
            <h3 className="text-xl font-semibold mb-2 text-[#666]">Search FanRealms</h3>
            <p className="text-[#999]">Find assets, tools, plugins, and creators</p>
          </div>
        )}

        {/* Too short */}
        {searchQuery && !hasQuery && (
          <div className="text-center py-20">
            <Search className="h-16 w-16 mx-auto mb-4 text-[#bbb]" />
            <h3 className="text-xl font-semibold mb-2 text-[#666]">Keep typing…</h3>
            <p className="text-[#999]">Enter at least 2 characters to search.</p>
          </div>
        )}

        {/* Loading */}
        {hasQuery && isLoading && (
          <div className="space-y-8">
            <div>
              <Skeleton className="h-5 w-24 mb-4" />
              <SkeletonGrid count={5} />
            </div>
            <div>
              <Skeleton className="h-5 w-24 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array(4).fill(0).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-20 w-full rounded-none" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {hasQuery && !isLoading && (
          <>
            {/* Assets */}
            {products.length > 0 && (
              <section>
                <h2 className="text-[15px] font-bold text-[#111] mb-4">
                  Assets <span className="text-[#aaa] font-normal">({products.length})</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {products.map((p: any) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}

            {/* Sellers */}
            {creators.length > 0 && (
              <section>
                <h2 className="text-[15px] font-bold text-[#111] mb-4">
                  Sellers <span className="text-[#aaa] font-normal">({creators.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {creators.map((creator: CreatorProfile) => (
                    <CreatorCard key={creator.id} creator={creator} />
                  ))}
                </div>
              </section>
            )}

            {/* No results */}
            {products.length === 0 && creators.length === 0 && (
              <div className="text-center py-20">
                <Search className="h-16 w-16 mx-auto mb-4 text-[#bbb]" />
                <h3 className="text-xl font-semibold mb-2 text-[#666]">No results found</h3>
                <p className="text-[#999]">
                  Nothing matched "{searchQuery}". Try different keywords or{' '}
                  <Link to="/marketplace" className="text-primary hover:underline">browse the marketplace</Link>.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
