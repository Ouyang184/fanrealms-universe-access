import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useProduct, useHasPurchased } from '@/hooks/useMarketplace';
import { useMarketplaceCheckout } from '@/hooks/useMarketplaceCheckout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Download, Tag, FileText, Shield, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ProductRatingsSection } from '@/components/ratings/ProductRatingsSection';
import { useProductRatingSummary } from '@/hooks/useProductRatings';
import { RatingSummary } from '@/components/ratings/StarRating';

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuth();
  const { data: product, isLoading } = useProduct(productId || '');
  const ratingSummary = useProductRatingSummary(productId || '');
  const [searchParams] = useSearchParams();
  const { checkout, isLoading: checkoutLoading } = useMarketplaceCheckout();
  const { data: hasPurchased } = useHasPurchased(productId || '');
  const [activeImg, setActiveImg] = useState(0);

  const isFree = !product?.price || Number(product.price) === 0;
  const canDownload = isFree || hasPurchased;

  const allImages = [
    ...(product?.cover_image_url ? [product.cover_image_url] : []),
    ...((product as any)?.screenshots ?? []),
  ];

  useEffect(() => { setActiveImg(0); }, [productId]);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Purchase complete! Your download is ready below.');
    }
  }, []);

  const handleDownload = () => {
    if (!(product as any)?.asset_url) { toast.error('Download link not available.'); return; }
    window.open((product as any).asset_url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="space-y-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-32 w-full" /></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Product not found.</p>
          <Button asChild variant="link"><Link to="/marketplace">Back to Marketplace</Link></Button>
        </div>
      </MainLayout>
    );
  }

  const p = product as any;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Back */}
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/marketplace"><ArrowLeft className="h-4 w-4 mr-1" />Marketplace</Link>
        </Button>

        {/* Title row */}
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">{p.title}</h1>
          {p.short_description && (
            <p className="text-[15px] text-muted-foreground mt-1">{p.short_description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {p.creators && (
              <span className="text-[13px] text-muted-foreground">
                by{' '}
                <Link to={`/seller/${p.creators.username}`} className="text-primary hover:underline font-medium">
                  {p.creators.display_name || p.creators.username}
                </Link>
              </span>
            )}
            <RatingSummary average={ratingSummary.average} count={ratingSummary.count} />
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">

          {/* Left: image gallery */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
              {allImages.length > 0 ? (
                <img src={allImages[activeImg]} alt={p.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Package className="w-12 h-12 opacity-30" />
                </div>
              )}
              {allImages.length > 1 && (
                <>
                  <button onClick={() => setActiveImg(i => (i - 1 + allImages.length) % allImages.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setActiveImg(i => (i + 1) % allImages.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {allImages.map((_, i) => (
                      <button key={i} onClick={() => setActiveImg(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeImg ? 'bg-white' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-16 h-10 rounded-md overflow-hidden border-2 transition-colors ${i === activeImg ? 'border-primary' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            {p.description && (
              <div className="pt-4">
                <h2 className="text-[15px] font-bold text-foreground mb-3">About this asset</h2>
                <p className="text-[14px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{p.description}</p>
              </div>
            )}

            {/* Ratings */}
            <div className="border-t border-border pt-6 mt-6">
              <ProductRatingsSection productId={p.id} />
            </div>
          </div>

          {/* Right: sticky sidebar */}
          <aside className="lg:sticky lg:top-20 space-y-4">

            {/* Price + CTA card */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div>
                {isFree ? (
                  <div className="text-[32px] font-bold text-green-600">Free</div>
                ) : (
                  <div className="text-[32px] font-bold text-foreground">${Number(p.price).toFixed(2)}</div>
                )}
              </div>

              {canDownload ? (
                <Button size="lg" className="w-full" onClick={handleDownload} disabled={!p.asset_url}>
                  <Download className="h-4 w-4 mr-2" />
                  {isFree ? 'Download' : 'Download your purchase'}
                </Button>
              ) : user ? (
                <Button size="lg" className="w-full" onClick={() => checkout(p.id)} disabled={checkoutLoading}>
                  {checkoutLoading ? 'Redirecting…' : `Buy Now — $${Number(p.price).toFixed(2)}`}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button size="lg" className="w-full" asChild>
                    <Link to={`/login?redirect=/marketplace/${productId}`}>
                      Sign in to {isFree ? 'download' : 'buy'}
                    </Link>
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    <Link to="/signup" className="text-primary hover:underline">Create a free account</Link>
                  </p>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground text-center">
                {isFree ? 'Free forever · no account required to browse' : 'Secure checkout via Stripe · instant download'}
              </p>
            </div>

            {/* Asset details */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wide">Details</h3>

              {p.category && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Package className="w-3.5 h-3.5" />Category</span>
                  <span className="font-medium">{p.category}</span>
                </div>
              )}

              {p.version && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Version</span>
                  <span className="font-medium">{p.version}</span>
                </div>
              )}

              {p.license && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />License</span>
                  <span className="font-medium text-right max-w-[140px]">{p.license}</span>
                </div>
              )}

              {p.tags?.length > 0 && (
                <div className="pt-1">
                  <span className="text-[12px] text-muted-foreground flex items-center gap-1.5 mb-2"><Tag className="w-3.5 h-3.5" />Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {p.tags.map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-[11px]">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Creator card */}
            {p.creators && (
              <Link to={`/seller/${p.creators.username}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors">
                {p.creators.profile_image_url ? (
                  <img src={p.creators.profile_image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[14px]">
                    {(p.creators.display_name || p.creators.username || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{p.creators.display_name || p.creators.username}</div>
                  <div className="text-[11px] text-muted-foreground">View creator profile →</div>
                </div>
              </Link>
            )}
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
