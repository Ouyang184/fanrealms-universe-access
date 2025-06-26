
import React from 'react';
import { useLikes } from '@/hooks/useLikes';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostLikesProps {
  postId: string;
}

export function PostLikes({ postId }: PostLikesProps) {
  const { user } = useAuth();
  const { likeCount, isLiked, toggleLike, isToggling } = useLikes(postId);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (!user) return;
    toggleLike();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={!user || isToggling}
        className={cn(
          "flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-colors",
          isLiked && "text-red-600"
        )}
      >
        <Heart 
          className={cn(
            "h-4 w-4 transition-all",
            isLiked && "fill-current"
          )} 
        />
        <span className="text-sm">
          {likeCount === 0 ? 'Like' : likeCount}
        </span>
      </Button>
    </div>
  );
}
