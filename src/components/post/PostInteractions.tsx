
import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Share2, Eye } from 'lucide-react';
import { PostLikes } from './PostLikes';
import { PostComments } from './PostComments';
import { usePostViews } from '@/hooks/usePostViews';

interface PostInteractionsProps {
  postId: string;
  authorId: string;
}

export const PostInteractions: React.FC<PostInteractionsProps> = ({ postId, authorId }) => {
  const { viewCount } = usePostViews(postId);

  return (
    <div className="border-t pt-4">
      {/* Engagement Stats */}
      <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          <span>{viewCount}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <PostLikes postId={postId} />
        
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600"
        >
          <Share2 className="h-4 w-4" />
          <span className="text-sm">Share</span>
        </Button>
      </div>

      {/* Comments Section */}
      <div className="mt-4 border-t pt-4">
        <PostComments postId={postId} />
      </div>
    </div>
  );
};
