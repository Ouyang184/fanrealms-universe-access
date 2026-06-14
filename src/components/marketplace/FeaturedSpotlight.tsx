import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface FeaturedProduct {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  sale_price?: number | null;
  category?: string | null;
  cover_image_url?: string | null;
  creators?: {
    display_name?: string | null;
    username?: string | null;
  } | null;
}

export function FeaturedSpotlight({ product }: { product: FeaturedProduct }) {
  const author = product.creators?.display_name || product.creators?.username || 'Unknown';
  const hasSale = product.sale_price != null && Number(product.sale_price) < Number(product.price);
  const price =
    product.price === 0 ? 'Free'
    : hasSale ? `$${Number(product.sale_price).toFixed(2)}`
    : `$${Number(product.price).toFixed(2)}`;

  return (
    <section className="border border-border bg-card">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr]">
        <Link
          to={`/marketplace/${product.id}`}
          className="aspect-[16/9] bg-muted overflow-hidden block max-h-[320px] w-full"
        >
          {product.cover_image_url ? (
            <img
              src={product.cover_image_url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-wide text-muted-foreground">
              No preview
            </div>
          )}
        </Link>
        <div className="p-4 sm:p-5 flex flex-col">
          <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
            Featured asset
          </div>
          <Link to={`/marketplace/${product.id}`}>
            <h2 className="text-[18px] sm:text-[20px] font-bold leading-tight tracking-tight hover:underline">
              {product.title}
            </h2>
          </Link>

          <div className="text-[12px] text-muted-foreground mt-1">by {author}</div>
          {product.description && (
            <p className="text-[13px] text-foreground/80 mt-3 leading-relaxed line-clamp-4">
              {product.description}
            </p>
          )}
          <div className="mt-auto pt-5 flex items-center gap-3">
            <Link
              to={`/marketplace/${product.id}`}
              className="inline-flex items-center gap-1.5 px-4 h-9 bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors"
            >
              Get the asset
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-[15px] font-bold">{price}</span>
            {hasSale && (
              <>
                <span className="text-[12px] text-muted-foreground line-through">${Number(product.price).toFixed(2)}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                  {Math.round((1 - Number(product.sale_price) / Number(product.price)) * 100)}% OFF
                </span>
              </>
            )}
            {product.category && (
              <span className="text-[11px] text-muted-foreground">· {product.category}</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
