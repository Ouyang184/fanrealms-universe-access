import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description?: string | null;
    price: number;
    cover_image_url?: string | null;
    category?: string | null;
    creators?: {
      username: string;
      display_name?: string | null;
      profile_image_url?: string | null;
    } | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {product.cover_image_url ? (
          <img
            src={product.cover_image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        {product.category && (
          <Badge className="absolute top-2 right-2" variant="secondary">
            {product.category}
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate">{product.title}</h3>
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {product.description}
          </p>
        )}
        {product.creators && (
          <p className="text-xs text-muted-foreground mt-2">
            by {product.creators.display_name || product.creators.username}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <span className="text-lg font-bold text-primary">
          ${product.price.toFixed(2)}
        </span>
        <Button asChild size="sm">
          <Link to={`/marketplace/${product.id}`}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
