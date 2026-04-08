import { MainLayout } from '@/components/Layout/MainLayout';
import { useCreatorProducts } from '@/hooks/useMarketplace';
import { CreateProductDialog } from '@/components/marketplace/CreateProductDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function CreatorProducts() {
  const { data: products, isLoading } = useCreatorProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your Products</h1>
          <p className="text-muted-foreground">Manage your digital products</p>
        </div>
        <CreateProductDialog />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="space-y-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${product.price.toFixed(2)} · {product.category}
                  </p>
                </div>
                <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                  {product.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No products yet. Create your first product to start selling!
        </div>
      )}
    </div>
  );
}
