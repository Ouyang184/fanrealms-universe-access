
import React from 'react';
import { Heart, MessageCircle, Share2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLikes } from '@/hooks/useLikes';
import { usePostViews } from '@/hooks/usePostViews';
import { ShareButton } from './ShareButton';

interface PostInteractionsProps {
  postId: string;
  initialLikes?: number;
  initialComments?: number;
  showCounts?: boolean;
}

export function PostInteractions({ 
  postId, 
  initialLikes = 0, 
  initialComments = 0,
  showCounts = true 
}: PostInteractionsProps) {
  const { likeCount, isLiked, toggleLike } = useLikes(postId);
  const { viewCount } = usePostViews(postId);

  const displayLikes = likeCount !== undefined ? likeCount : initialLikes;
  const displayComments = initialComments;

  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLike}
          className={`flex items-center space-x-2 ${
            isLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          {showCounts && <span>{displayLikes}</span>}
        </Button>

        <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
          <MessageCircle className="h-4 w-4" />
          {showCounts && <span>{displayComments}</span>}
        </Button>

        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
          <Eye className="h-3 w-3" />
          <span>{Number(viewCount) || 0}</span>
        </div>
      </div>

      <ShareButton postId={postId} />
    </div>
  );
}
