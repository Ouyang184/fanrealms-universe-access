import { useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useProduct } from '@/hooks/useMarketplace';
import { useMarketplaceCheckout } from '@/hooks/useMarketplaceCheckout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ProductRatingsSection } from '@/components/ratings/ProductRatingsSection';
import { useProductRatingSummary } from '@/hooks/useProductRatings';
import { RatingSummary } from '@/components/ratings/StarRating';

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const { data: product, isLoading } = useProduct(productId || '');
  const ratingSummary = useProductRatingSummary(productId || '');
  const [searchParams] = useSearchParams();
  const { checkout, isLoading: checkoutLoading } = useMarketplaceCheckout();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Purchase complete! Check your email for your download link.');
    }
  }, []);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-4 max-w-3xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-20 w-full" />
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

  return (
    <MainLayout fullWidth>
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/marketplace"><ArrowLeft className="h-4 w-4 mr-2" />Back to Marketplace</Link>
        </Button>

        {product.cover_image_url && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{product.title}</h1>
            {product.creators && (
              <p className="text-muted-foreground">
                by {product.creators.display_name || product.creators.username}
              </p>
            )}
            <div className="mt-1.5">
              <RatingSummary average={ratingSummary.average} count={ratingSummary.count} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</p>
            {product.category && <Badge variant="outline">{product.category}</Badge>}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <p className="whitespace-pre-wrap">{product.description || 'No description provided.'}</p>
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full"
          onClick={() => checkout(product.id)}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? 'Redirecting to checkout…' : `Buy Now — $${product.price.toFixed(2)}`}
        </Button>

        <div className="border-t border-[#eee] pt-6">
          <ProductRatingsSection productId={product.id} />
        </div>
      </div>
    </MainLayout>
  );
}
