import { useState } from 'react';
import { StarRating } from './StarRating';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface RatingFormProps {
  initialRating?: number;
  initialReview?: string;
  isEditing?: boolean;
  onSubmit: (rating: number, review?: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function RatingForm({
  initialRating = 0,
  initialReview = '',
  isEditing = false,
  onSubmit,
  onDelete,
  onCancel,
  isSubmitting = false,
}: RatingFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [review, setReview] = useState(initialReview);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    await onSubmit(rating, review.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="text-[13px] font-medium text-[#333] mb-2">Your rating</div>
        <StarRating rating={rating} onRatingChange={setRating} size="lg" />
        {rating === 0 && (
          <p className="text-[12px] text-[#aaa] mt-1">Click a star to rate</p>
        )}
      </div>

      <div>
        <div className="text-[13px] font-medium text-[#333] mb-1.5">
          Review <span className="text-[#aaa] font-normal">(optional)</span>
        </div>
        <Textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="What did you think of this product?"
          rows={3}
          maxLength={1000}
          className="text-[13px] resize-none"
        />
        <p className="text-[11px] text-[#ccc] mt-1 text-right">{review.length}/1000</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={rating === 0 || isSubmitting}
            className="text-[13px]"
          >
            {isSubmitting ? 'Saving…' : isEditing ? 'Update review' : 'Submit review'}
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-[13px]">
              Cancel
            </Button>
          )}
        </div>
        {isEditing && onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isSubmitting}
            className="text-[13px] text-[#aaa] hover:text-red-500"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Remove
          </Button>
        )}
      </div>
    </form>
  );
}
