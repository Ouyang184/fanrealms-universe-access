
import React from 'react';
import { PostLikes } from './PostLikes';
import { PostComments } from './PostComments';
import { Button } from '@/components/ui/button';
import { Share2, Bookmark, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDeletePost } from '@/hooks/useDeletePost';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PostInteractionsProps {
  postId: string;
  authorId?: string;
}

export function PostInteractions({ postId, authorId }: PostInteractionsProps) {
  const { user } = useAuth();
  const { deletePost, isDeleting } = useDeletePost();
  const isAuthor = user?.id === authorId;

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

  const handleDelete = () => {
    deletePost(postId);
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

          {isAuthor && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your post
                    and remove all associated comments and likes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Post'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Comments section */}
      <PostComments postId={postId} />
    </div>
  );
}
