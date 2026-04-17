import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  useProductRatings,
  useProductRatingSummary,
  useMyProductRating,
  useSubmitProductRating,
  useDeleteProductRating,
} from '@/hooks/useProductRatings';
import { StarRating, RatingSummary } from './StarRating';
import { RatingForm } from './RatingForm';

interface ProductRatingsSectionProps {
  productId: string;
}

export function ProductRatingsSection({ productId }: ProductRatingsSectionProps) {
  const { user } = useAuth();
  const { data: ratings, isLoading } = useProductRatings(productId);
  const summary = useProductRatingSummary(productId);
  const myRating = useMyProductRating(productId);
  const submitMutation = useSubmitProductRating(productId);
  const deleteMutation = useDeleteProductRating(productId);
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = async (rating: number, review?: string) => {
    await submitMutation.mutateAsync({ rating, review });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync();
    setIsEditing(false);
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-bold tracking-[-0.3px]">Reviews</h2>
          {summary.count > 0 && (
            <RatingSummary average={summary.average} count={summary.count} />
          )}
        </div>
        {user && !myRating && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[12px] font-semibold text-primary hover:underline"
          >
            Write a review
          </button>
        )}
      </div>

      {/* Write / edit form */}
      {user && (isEditing || myRating) && (
        <div className="bg-[#fafafa] border border-[#eee] rounded-xl p-4">
          {myRating && !isEditing ? (
            // Show the user's existing rating compactly
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-semibold text-[#333]">Your review</div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-[12px] text-primary hover:underline"
                >
                  Edit
                </button>
              </div>
              <StarRating rating={myRating.rating} readonly size="sm" />
              {myRating.review && (
                <p className="text-[13px] text-[#555] leading-relaxed">{myRating.review}</p>
              )}
            </div>
          ) : (
            <RatingForm
              initialRating={myRating?.rating ?? 0}
              initialReview={myRating?.review ?? ''}
              isEditing={!!myRating}
              onSubmit={handleSubmit}
              onDelete={myRating ? handleDelete : undefined}
              onCancel={() => setIsEditing(false)}
              isSubmitting={submitMutation.isPending || deleteMutation.isPending}
            />
          )}
        </div>
      )}

      {/* Not logged in nudge */}
      {!user && (
        <p className="text-[13px] text-[#aaa]">
          <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
          {' '}to leave a review.
        </p>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-[#f5f5f5] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : ratings && ratings.length > 0 ? (
        <div className="space-y-3">
          {ratings
            .filter((r) => r.user_id !== user?.id) // don't double-show own review
            .map((r) => (
              <div key={r.id} className="bg-white border border-[#eee] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#111] flex items-center justify-center text-white text-[10px] font-bold">
                      {(r.users?.username || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[12px] font-medium text-[#555]">
                      {r.users?.username || 'Anonymous'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={r.rating} readonly size="sm" />
                    <span className="text-[11px] text-[#ccc]">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                {r.review && (
                  <p className="text-[13px] text-[#555] leading-relaxed">{r.review}</p>
                )}
              </div>
            ))}
        </div>
      ) : (
        !user || (!isEditing && !myRating) ? (
          <p className="text-[13px] text-[#aaa]">No reviews yet. Be the first.</p>
        ) : null
      )}
    </div>
  );
}
