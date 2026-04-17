import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;       // current value 0–5
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

export function StarRating({
  rating,
  onRatingChange,
  size = 'md',
  readonly = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || rating;
  const px = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' }[size];

  return (
    <div
      className={`flex items-center gap-0.5 ${!readonly ? 'cursor-pointer' : ''}`}
      onMouseLeave={() => !readonly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${px} transition-colors ${
            star <= active ? 'fill-amber-400 text-amber-400' : 'fill-none text-[#ddd]'
          } ${!readonly ? 'hover:fill-amber-400 hover:text-amber-400' : ''}`}
          onMouseEnter={() => !readonly && setHovered(star)}
          onClick={() => !readonly && onRatingChange?.(star)}
        />
      ))}
    </div>
  );
}

/** Compact inline: ★ 4.2 (18) */
export function RatingSummary({ average, count }: { average: number; count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
      <span className="text-[12px] font-semibold text-[#333]">{average.toFixed(1)}</span>
      <span className="text-[11px] text-[#aaa]">({count})</span>
    </div>
  );
}
