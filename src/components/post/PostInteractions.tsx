
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { PostLikes } from './PostLikes';
import { PostComments } from './PostComments';
import { ShareButton } from './ShareButton';
import { SaveButton } from './SaveButton';
import { usePostViews } from '@/hooks/usePostViews';

interface PostInteractionsProps {
  postId: string;
  authorId: string;
  postTitle?: string;
  postContent?: string;
  creatorName?: string;
  creatorUsername?: string;
  isPublic?: boolean;
}

export const PostInteractions: React.FC<PostInteractionsProps> = ({ 
  postId, 
  authorId,
  postTitle = "Untitled Post",
  postContent = "",
  creatorName = "Creator",
  creatorUsername,
  isPublic = true
}) => {
  const { viewCount } = usePostViews(postId);

  return (
    <div className="border-t pt-4">
      {/* Engagement Stats */}
      <div className="flex items-center gap-4 sm:gap-6 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          <span>{viewCount}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <PostLikes postId={postId} />
        
        <SaveButton postId={postId} />
        
        <ShareButton
          postId={postId}
          postTitle={postTitle}
          postContent={postContent}
          creatorName={creatorName}
          creatorUsername={creatorUsername}
          isPublic={isPublic}
        />
      </div>

      {/* Comments Section */}
      <div className="mt-4 border-t pt-4">
        <PostComments postId={postId} />
      </div>
    </div>
  );
};
