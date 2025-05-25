
import React from 'react';
import { PostLikes } from './PostLikes';
import { PostComments } from './PostComments';
import { Button } from '@/components/ui/button';
import { Share2, Bookmark } from 'lucide-react';

interface PostInteractionsProps {
  postId: string;
}

export function PostInteractions({ postId }: PostInteractionsProps) {
  const handleShare = () => {
    // Copy post URL to clipboard
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    // Could add toast notification here
  };

  const handleBookmark = () => {
    // Placeholder for bookmark functionality
    console.log('Bookmark post:', postId);
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex items-center justify-between border-t border-b py-3">
        <div className="flex items-center gap-1">
          <PostLikes postId={postId} />
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm">Share</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className="flex items-center gap-2 hover:bg-yellow-50 hover:text-yellow-600"
          >
            <Bookmark className="h-4 w-4" />
            <span className="text-sm">Save</span>
          </Button>
        </div>
      </div>

      {/* Comments section */}
      <PostComments postId={postId} />
    </div>
  );
}
