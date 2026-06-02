import { Link } from 'react-router-dom';
import { useProductRatingSummary } from '@/hooks/useProductRatings';
import { RatingSummary } from '@/components/ratings/StarRating';

interface Product {
  id: string;
  title: string;
  price: number;
  sale_price?: number | null;
  pricing_model?: string | null;
  category?: string | null;
  cover_image_url?: string | null;
  creators?: {
    id?: string;
    display_name?: string | null;
    username?: string | null;
    profile_image_url?: string | null;
  } | null;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const authorName = product.creators?.display_name || product.creators?.username || 'Unknown';
  const hasSale = product.sale_price != null && Number(product.sale_price) < Number(product.price);
  const priceDisplay =
    product.pricing_model === 'name_your_price' ? 'Name your price' :
    product.price === 0 ? 'Free' :
    hasSale ? `$${Number(product.sale_price).toFixed(2)}` :
    `$${Number(product.price).toFixed(2)}`;
  const imageUrl = product.cover_image_url;
  const ratingSummary = useProductRatingSummary(product.id);

  return (
    <Link
      to={`/marketplace/${product.id}`}
      className="group bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative aspect-[4/3] bg-[#f5f5f5] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-[#ccc] font-medium uppercase tracking-wide">
            No preview
          </div>
        )}
        {hasSale && (
          <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-white">
            {Math.round((1 - Number(product.sale_price) / Number(product.price)) * 100)}% OFF
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="text-[13px] font-semibold leading-snug truncate">{product.title}</div>
        <div className="text-[11px] text-[#aaa] mt-0.5 truncate">{authorName}</div>
        <div className="flex items-center justify-between mt-2">
          <RatingSummary average={ratingSummary.average} count={ratingSummary.count} />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-bold">{priceDisplay}</span>
            {hasSale && (
              <span className="text-[11px] text-[#aaa] line-through">${Number(product.price).toFixed(2)}</span>
            )}
          </div>
          {product.category && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#eef4fb] text-primary">
              {product.category}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
