import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "./StarRating";
import { Trash2 } from "lucide-react";

interface RatingFormProps {
  creatorName: string;
  initialRating?: number;
  initialReview?: string;
  isEditing?: boolean;
  onSubmit: (rating: number, review?: string) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function RatingForm({
  creatorName,
  initialRating = 0,
  initialReview = "",
  isEditing = false,
  onSubmit,
  onDelete,
  onCancel,
  isSubmitting = false
}: RatingFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [review, setReview] = useState(initialReview);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    const success = await onSubmit(rating, review.trim() || undefined);
    if (success && onCancel) {
      onCancel();
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      const success = await onDelete();
      if (success && onCancel) {
        onCancel();
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEditing ? "Edit Your Rating" : "Rate Your Experience"} with {creatorName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Rating *
            </label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size="lg"
            />
            {rating === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Please select a rating
              </p>
            )}
          </div>

          <div>
            <label htmlFor="review" className="block text-sm font-medium mb-2">
              Review (optional)
            </label>
            <Textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this creator..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {review.length}/1000 characters
            </p>
          </div>

          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="min-w-20"
              >
                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Submit"}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}