import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ShoppingBag, Loader2, Check, ArrowLeft } from 'lucide-react';
import { usePublicBundle, useUserOwnsBundle, useBundleCheckout } from '@/hooks/useBundles';
import { useAuth } from '@/contexts/AuthContext';

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function BundleDetailPage() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: bundle, isLoading, error } = usePublicBundle(bundleId);
  const { data: owned } = useUserOwnsBundle(bundleId);
  const { checkout, isLoading: checkingOut } = useBundleCheckout();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-8 space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !bundle) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-16 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Bundle not found</h1>
          <p className="text-muted-foreground mb-6">This bundle may not be published yet.</p>
          <Button asChild variant="outline"><Link to="/marketplace"><ArrowLeft className="w-4 h-4 mr-2" />Back to marketplace</Link></Button>
        </div>
      </MainLayout>
    );
  }

  const creator = bundle.creators as any;
  const items: any[] = bundle.bundle_items ?? [];
  const isOwnBundle = user?.id && creator?.id && bundle.creator_id && false; // creator user_id not selected; safe-guard via server

  const handleBuy = () => {
    if (!user) { navigate('/login?redirect=' + encodeURIComponent(`/bundles/${bundleId}`)); return; }
    if (bundleId) checkout(bundleId);
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto py-6 px-4">
        <Link to="/marketplace" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Marketplace
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {bundle.cover_image_url ? (
              <img src={bundle.cover_image_url} alt={bundle.title} className="w-full aspect-video object-cover rounded-xl border border-border" />
            ) : (
              <div className="w-full aspect-video rounded-xl bg-muted flex items-center justify-center border border-border">
                <Package className="w-16 h-16 text-muted-foreground" />
              </div>
            )}

            <div className="mt-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary mb-2">
                <Package className="w-3.5 h-3.5" /> Bundle · {items.length} project{items.length === 1 ? '' : 's'}
              </span>
              <h1 className="text-3xl font-bold tracking-tight mb-2">{bundle.title}</h1>
              {creator && (
                <p className="text-sm text-muted-foreground">
                  by <Link to={`/${creator.username}`} className="text-primary hover:underline">{creator.display_name || creator.username}</Link>
                </p>
              )}
              {bundle.description && (
                <p className="text-foreground/80 leading-relaxed mt-4 whitespace-pre-wrap">{bundle.description}</p>
              )}
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-bold mb-3">What's included</h2>
              <div className="space-y-2">
                {items.map((item) => {
                  const p = item.projects;
                  if (!p) return null;
                  return (
                    <Link
                      key={item.id}
                      to={`/projects/${p.slug || p.id}`}
                      className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="w-14 h-14 rounded bg-muted overflow-hidden flex-shrink-0">
                        {p.cover_image_url && <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{p.title}</div>
                        {p.short_description && <div className="text-xs text-muted-foreground truncate">{p.short_description}</div>}
                      </div>
                    </Link>
                  );
                })}
                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground">No items in this bundle yet.</p>
                )}
              </div>
            </div>
          </div>

          <aside className="md:col-span-1">
            <div className="sticky top-6 bg-card border border-border rounded-xl p-5">
              <div className="text-3xl font-bold mb-1">{fmt(bundle.bundle_price)}</div>
              <div className="text-xs text-muted-foreground mb-5">One-time purchase · Lifetime access</div>

              {owned ? (
                <Button asChild className="w-full" size="lg">
                  <Link to="/library"><Check className="w-4 h-4 mr-2" />You own this — go to library</Link>
                </Button>
              ) : (
                <Button onClick={handleBuy} disabled={checkingOut || isOwnBundle} className="w-full" size="lg">
                  {checkingOut ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecting…</> : <><ShoppingBag className="w-4 h-4 mr-2" />Buy bundle</>}
                </Button>
              )}

              <ul className="mt-5 space-y-2 text-sm text-foreground/80">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />Get all {items.length} item{items.length === 1 ? '' : 's'} in one purchase</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />Downloads added to your library</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />Secure checkout via Stripe</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
