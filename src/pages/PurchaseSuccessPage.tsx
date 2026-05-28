import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Download, ArrowLeft, Loader2, CheckCircle2, Package } from 'lucide-react';
import { toast } from 'sonner';

type State = 'loading' | 'ready' | 'error';

export default function PurchaseSuccessPage() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product_id');
  const { user } = useAuth();

  const [state, setState] = useState<State>('loading');
  const [product, setProduct] = useState<{ title: string; price: number } | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Fetch product info + wait for purchase to be recorded (webhook can be a second or two behind)
  useEffect(() => {
    if (!productId) { setState('error'); return; }

    let cancelled = false;
    let attempts = 0;
    const MAX = 8;

    const tryLoad = async () => {
      try {
        // Fetch product details
        const { data: p, error: pErr } = await supabase
          .from('digital_products')
          .select('title, price')
          .eq('id', productId)
          .maybeSingle();

        if (pErr || !p) { setState('error'); return; }
        if (!cancelled) setProduct({ title: p.title, price: p.price });

        // Poll until the purchase record appears (webhook may not have fired yet)
        const poll = async () => {
          if (cancelled) return;
          attempts++;

          const purchaseQuery = supabase
            .from('purchases')
            .select('id')
            .eq('product_id', productId)
            .eq('status', 'completed');
          // Scope to the current buyer when known so concurrent purchases
          // from other users don't trigger a false-positive "ready" state.
          if (user?.id) purchaseQuery.eq('buyer_id', user.id);
          const { data: purchase } = await purchaseQuery.maybeSingle();

          if (purchase) {
            if (!cancelled) setState('ready');
          } else if (attempts < MAX) {
            setTimeout(poll, 1500);
          } else {
            // Webhook took too long — show the page anyway, download will verify server-side
            if (!cancelled) setState('ready');
          }
        };

        poll();
      } catch {
        if (!cancelled) setState('error');
      }
    };

    tryLoad();
    return () => { cancelled = true; };
  }, [productId]);

  const handleDownload = async () => {
    if (!productId) return;
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-download-url', {
        body: { product_id: productId },
      });
      if (error || !data?.url) {
        toast.error(data?.error || 'Download unavailable. Please try again in a moment.');
        return;
      }
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto py-16 px-4">

        {state === 'loading' && (
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto" />
            <p className="text-muted-foreground text-sm">Confirming your purchase…</p>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center space-y-4">
            <Package className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">
              We couldn't load your purchase. If you were charged, check{' '}
              <Link to="/library" className="text-primary hover:underline">your library</Link>.
            </p>
            <Button asChild variant="outline">
              <Link to="/marketplace">Back to marketplace</Link>
            </Button>
          </div>
        )}

        {state === 'ready' && product && (
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Purchase complete</h1>
              <p className="text-muted-foreground text-sm">Thanks for your purchase. Your download is ready.</p>
            </div>

            {/* Asset card */}
            <div className="border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[15px]">{product.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {Number(product.price) === 0
                      ? 'Free'
                      : `$${Number(product.price).toFixed(2)} · one-time purchase`}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Preparing download…</>
                ) : (
                  <><Download className="mr-2 h-4 w-4" />Download now</>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                You can re-download this anytime from{' '}
                <Link to="/library" className="text-primary hover:underline">your library</Link>.
              </p>
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between text-sm">
              <Link
                to="/marketplace"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to marketplace
              </Link>
              <Link
                to={`/marketplace/${productId}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                View product page →
              </Link>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
