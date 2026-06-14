import { Link } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  price: number;
  sale_price?: number | null;
  category?: string | null;
  cover_image_url?: string | null;
  creators?: {
    display_name?: string | null;
    username?: string | null;
  } | null;
}

export function ProductGridDense({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map((p) => (
        <DenseCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function DenseCard({ product }: { product: Product }) {
  const author = product.creators?.display_name || product.creators?.username || 'Unknown';
  const hasSale = product.sale_price != null && Number(product.sale_price) < Number(product.price);
  const price =
    product.price === 0 ? 'Free'
    : hasSale ? `$${Number(product.sale_price).toFixed(2)}`
    : `$${Number(product.price).toFixed(2)}`;

  return (
    <Link
      to={`/marketplace/${product.id}`}
      className="group block border border-border bg-card hover:border-foreground/30 transition-colors"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {product.cover_image_url ? (
          <img
            src={product.cover_image_url}
            alt={product.title}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-wide text-muted-foreground">
            No preview
          </div>
        )}
        {hasSale && (
          <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-white">
            {Math.round((1 - Number(product.sale_price) / Number(product.price)) * 100)}% OFF
          </span>
        )}
      </div>
      <div className="px-2.5 py-2">
        <div className="text-[13px] font-semibold leading-snug truncate group-hover:underline">
          {product.title}
        </div>
        <div className="text-[11px] text-muted-foreground truncate">{author}</div>
        <div className="flex items-center justify-between mt-1">
          <span className="flex items-center gap-1">
            <span className="text-[12.5px] font-bold">{price}</span>
            {hasSale && (
              <span className="text-[10.5px] text-muted-foreground line-through">${Number(product.price).toFixed(2)}</span>
            )}
          </span>
          {product.category && (
            <span className="text-[10px] text-muted-foreground truncate ml-2">
              {product.category}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
