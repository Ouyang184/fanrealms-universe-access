import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useProductComments } from '@/hooks/useProductComments';
import { ProductCommentsSection } from '@/components/comments/ProductCommentsSection';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useProduct, useHasPurchased } from '@/hooks/useMarketplace';
import { useMarketplaceCheckout } from '@/hooks/useMarketplaceCheckout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Download, Tag, FileText, Shield, Package, ChevronLeft, ChevronRight, Loader2, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ProductRatingsSection } from '@/components/ratings/ProductRatingsSection';
import { useProductRatingSummary } from '@/hooks/useProductRatings';
import { RatingSummary } from '@/components/ratings/StarRating';
import { MarkdownContent } from '@/components/editor/RichDescriptionEditor';
import { ProductChangelogSection } from '@/components/marketplace/ProductChangelogSection';
import { PageSeo } from '@/components/PageSeo';

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuth();
  const { data: product, isLoading } = useProduct(productId || '');
  const ratingSummary = useProductRatingSummary(productId || '');
const { checkout, isLoading: checkoutLoading } = useMarketplaceCheckout();
  const { data: hasPurchased } = useHasPurchased(productId || '');
  const [activeImg, setActiveImg] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') ?? 'about') as 'about' | 'community';
  const { data: allComments } = useProductComments(productId ?? '');
  const commentCount = (allComments ?? []).filter((c) => !c.is_deleted).length;

  const pricingModel = (product as any)?.pricing_model ?? 'paid';
  const isNYP = pricingModel === 'name_your_price';
  const isFree = pricingModel === 'free' || (!isNYP && (!product?.price || Number(product.price) === 0));
  // Guests can't download free assets (need account so item is saved to library)
  const canDownload = (isFree && !!user) || hasPurchased;

  // Name-your-price state — default to the suggested price if set
  const suggestedPrice = isNYP ? Number((product as any)?.price ?? 0) : 0;
  const [nypInput, setNypInput] = useState(suggestedPrice > 0 ? suggestedPrice.toFixed(2) : '');
  const nypCents = Math.round(parseFloat(nypInput || '0') * 100);
  const nypValid = nypCents >= 50;

  // Donation (tip) state — optional support on a free asset
  const [donateOpen, setDonateOpen] = useState(false);
  const [donateInput, setDonateInput] = useState('5');
  const donateCents = Math.round(parseFloat(donateInput || '0') * 100);
  const donateValid = donateCents >= 50;

  // Thank-you toast after returning from a successful donation checkout
  useEffect(() => {
    if (searchParams.get('donated') === '1') {
      toast.success('Thank you for your support! 💚', {
        description: 'Your tip went straight to the creator.',
      });
      searchParams.delete('donated');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const allImages = [
    ...(product?.cover_image_url ? [product.cover_image_url] : []),
    ...((product as any)?.screenshots ?? []),
  ];

  /** Convert a YouTube or Vimeo watch URL into an embed URL. Returns null if not recognised. */
  const getEmbedUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    // YouTube: youtu.be/ID or youtube.com/watch?v=ID or youtube.com/shorts/ID
    const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    const ytWatch = url.match(/youtube\.com\/(?:watch\?v=|shorts\/)([a-zA-Z0-9_-]{11})/);
    const ytId = (ytShort || ytWatch)?.[1];
    if (ytId) return `https://www.youtube.com/embed/${ytId}`;
    // Vimeo: vimeo.com/ID
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return null;
  };

  const embedUrl = getEmbedUrl((product as any)?.trailer_url);

  useEffect(() => { setActiveImg(0); }, [productId]);


  const handleDownload = async () => {
    if (!productId) return;
    setDownloading(true);
    try {
      // For free assets: record a purchase so the item appears in the
      // user's Library and can be re-downloaded anytime. Uses a
      // SECURITY DEFINER RPC so authenticated users can't fake paid purchases.
      if (isFree && user) {
        await supabase.rpc('record_free_download' as any, { p_product_id: productId });
      }

      const { data, error } = await supabase.functions.invoke('get-download-url', {
        body: { product_id: productId },
      });
      if (error || !data?.url) {
        toast.error(data?.error || 'Download unavailable. Please try again.');
        return;
      }
      window.open(data.url, '_blank', 'noopener,noreferrer');

      // Confirm to the user that the item is saved to their library
      if (isFree && user) {
        toast.success('Added to your library!', {
          description: 'You can re-download this anytime from your Library.',
          duration: 5000,
        });
      }
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
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

  // Creator page customization — validate the accent color so we never inject
  // arbitrary CSS, and only show a banner if one was set.
  const accent: string | null =
    typeof p.accent_color === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(p.accent_color)
      ? p.accent_color
      : null;
  const bannerUrl: string | null = typeof p.banner_image_url === 'string' && p.banner_image_url ? p.banner_image_url : null;

  const productImage = p.cover_image_url || ((p as any).screenshots?.[0]) || undefined;
  const productPrice = Number(p.price ?? 0);
  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.short_description || p.description || p.title,
    ...(productImage ? { image: productImage } : {}),
    ...(p.creators
      ? { brand: { "@type": "Brand", name: p.creators.display_name || p.creators.username } }
      : {}),
    ...(ratingSummary.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingSummary.average,
            reviewCount: ratingSummary.count,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: isFree ? 0 : productPrice,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://fanrealms.com/marketplace/${productId}`,
    },
  };

  return (
    <MainLayout>
      <PageSeo
        title={p.title}
        description={p.short_description || (typeof p.description === 'string' ? p.description.slice(0, 155) : `${p.title} — a Godot asset on FanRealms.`)}
        canonicalPath={`/marketplace/${productId}`}
        ogType="product"
        ogImage={productImage}
        jsonLd={productJsonLd}
      />
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Back */}
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/marketplace"><ArrowLeft className="h-4 w-4 mr-1" />Marketplace</Link>
        </Button>

        {/* Creator banner (custom page header) */}
        {(bannerUrl || accent) && (
          <div
            className="w-full aspect-[4/1] rounded-xl overflow-hidden border border-border flex items-center justify-center"
            style={{ backgroundColor: accent ?? undefined }}
          >
            {bannerUrl && (
              <img src={bannerUrl} alt={`${p.title} banner`} className="w-full h-full object-cover" />
            )}
          </div>
        )}

        {/* Title row */}
        <div>
          <h1
            className="text-[26px] font-bold tracking-tight text-foreground"
            style={accent ? { color: accent } : undefined}
          >
            {p.title}
          </h1>
          {p.short_description && (
            <p className="text-[15px] text-muted-foreground mt-1">{p.short_description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {p.creators && (
              <span className="text-[13px] text-muted-foreground">
                by{' '}
                <Link to={`/${p.creators.username}`} className="text-primary hover:underline font-medium">
                  {p.creators.display_name || p.creators.username}
                </Link>
              </span>
            )}
            <RatingSummary average={ratingSummary.average} count={ratingSummary.count} />
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-border">
          <button
            onClick={() => setSearchParams(activeTab === 'about' ? {} : { tab: 'about' })}
            className={`px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'about'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'community' })}
            className={`px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'community'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Community
            {commentCount > 0 && (
              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                ({commentCount})
              </span>
            )}
          </button>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start lg:grid-flow-col">

          {/* Left: tab content */}
          <div className="space-y-3">
            {activeTab === 'about' ? (
              <>
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

                {/* Trailer video */}
                {embedUrl && (
                  <div className="pt-2">
                    <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
                      <iframe
                        src={embedUrl}
                        title="Trailer"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                {p.description && (
                  <div className="pt-4">
                    <h2 className="text-[15px] font-bold text-foreground mb-3">About this asset</h2>
                    <MarkdownContent>{p.description}</MarkdownContent>
                  </div>
                )}

                {/* Ratings */}
                <div className="border-t border-border pt-6 mt-6">
                  <ProductRatingsSection productId={p.id} />
                </div>

                {/* Changelog */}
                <ProductChangelogSection productId={p.id} />
              </>
            ) : (
              <ProductCommentsSection
                productId={p.id}
                creatorUserId={p.creators?.user_id ?? null}
              />
            )}
          </div>

          {/* Right: sticky sidebar — renders first on mobile via order */}
          <aside className="lg:sticky lg:top-20 space-y-4 order-first lg:order-last">

            {/* Price + CTA card */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div>
                {isFree ? (
                  <div className="text-[32px] font-bold text-green-600">Free</div>
                ) : isNYP ? (
                  <div>
                    <div className="text-[13px] font-semibold text-muted-foreground mb-1">Name your price</div>
                    {suggestedPrice > 0 && (
                      <div className="text-[12px] text-muted-foreground mb-2">
                        Suggested: ${suggestedPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                ) : p.sale_price != null && Number(p.sale_price) < Number(p.price) ? (
                  <div className="flex items-center gap-2.5">
                    <span className="text-[32px] font-bold text-primary leading-none">${Number(p.sale_price).toFixed(2)}</span>
                    <span className="text-[18px] text-muted-foreground line-through leading-none">${Number(p.price).toFixed(2)}</span>
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 leading-none">
                      {Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100)}% OFF
                    </span>
                  </div>
                ) : (
                  <div className="text-[32px] font-bold text-foreground">${Number(p.price).toFixed(2)}</div>
                )}
              </div>

              {/* Name-your-price input */}
              {isNYP && !canDownload && (
                <div className="space-y-1">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-muted-foreground">$</span>
                    <input
                      type="number"
                      min="0.50"
                      step="0.50"
                      placeholder={suggestedPrice > 0 ? suggestedPrice.toFixed(2) : '1.00'}
                      value={nypInput}
                      onChange={e => setNypInput(e.target.value)}
                      className="w-full pl-7 pr-3 h-10 rounded-md border border-input bg-background text-[15px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Minimum $0.50</p>
                </div>
              )}

              {canDownload ? (
                <Button size="lg" className="w-full" onClick={handleDownload} disabled={downloading}>
                  {downloading
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Getting link…</>
                    : <><Download className="h-4 w-4 mr-2" />{isFree ? 'Download' : 'Download your purchase'}</>
                  }
                </Button>
              ) : user ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => checkout(p.id, isNYP ? parseFloat(nypInput) : undefined)}
                  disabled={checkoutLoading || (isNYP && !nypValid)}
                >
                  {checkoutLoading
                    ? 'Redirecting…'
                    : isNYP
                    ? `Pay $${nypValid ? parseFloat(nypInput).toFixed(2) : '—'}`
                    : `Buy Now — $${p.sale_price != null && Number(p.sale_price) < Number(p.price) ? Number(p.sale_price).toFixed(2) : Number(p.price).toFixed(2)}`}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button size="lg" className="w-full" asChild>
                    <Link to={`/login?returnTo=${encodeURIComponent(`/marketplace/${productId}`)}`}>
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

              {/* Optional tip — only on free assets, for logged-in visitors */}
              {isFree && user && (
                <div className="pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => setDonateOpen(true)}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Support the creator
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center mt-1.5">
                    This asset is free — tipping is totally optional
                  </p>
                </div>
              )}
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

              {p.godot_version && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Godot</span>
                  <span className="font-medium">{p.godot_version}</span>
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
                      <Link key={t} to={`/marketplace?tag=${encodeURIComponent(t)}`}>
                        <Badge variant="secondary" className="text-[11px] cursor-pointer hover:bg-secondary/80 transition-colors">{t}</Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Creator card */}
            {p.creators && (
              <Link to={`/${p.creators.username}`}
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

      {/* Donation dialog */}
      <Dialog open={donateOpen} onOpenChange={setDonateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              Support {p.creators?.display_name || p.creators?.username || 'the creator'}
            </DialogTitle>
            <DialogDescription>
              "{p.title}" is free. If it helped you, you can leave an optional tip — it goes straight to the creator.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              {['3', '5', '10'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDonateInput(amt)}
                  className={`flex-1 py-2 rounded-lg text-[14px] font-semibold border transition-colors ${
                    donateInput === amt
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-background text-foreground border-input hover:border-rose-300'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0.50"
                  step="0.50"
                  value={donateInput}
                  onChange={e => setDonateInput(e.target.value)}
                  className="w-full pl-7 pr-3 h-10 rounded-md border border-input bg-background text-[15px] font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Minimum $0.50</p>
            </div>

            <Button
              className="w-full bg-rose-500 hover:bg-rose-600"
              disabled={!donateValid || checkoutLoading}
              onClick={() => checkout(p.id, parseFloat(donateInput), true)}
            >
              {checkoutLoading
                ? 'Redirecting…'
                : <><Heart className="h-4 w-4 mr-2" />Tip ${donateValid ? parseFloat(donateInput).toFixed(2) : '—'}</>}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Secure payment via Stripe. The download stays free either way.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
