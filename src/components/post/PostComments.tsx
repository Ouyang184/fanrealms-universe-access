
import React, { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, MessageSquare } from 'lucide-react';
import { formatRelativeDate } from '@/utils/auth-helpers';
import LoadingSpinner from '@/components/LoadingSpinner';

interface PostCommentsProps {
  postId: string;
}

export function PostComments({ postId }: PostCommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const { 
    comments, 
    isLoading, 
    error,
    addComment, 
    deleteComment, 
    isAddingComment 
  } = useComments(postId);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newComment.trim() || !user) return;
    
    addComment(newComment.trim());
    setNewComment('');
  };

  const handleToggleComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(!showComments);
  };

  const handleDeleteComment = (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation();
    deleteComment(commentId);
  };

  // Debug logging
  React.useEffect(() => {
    console.log('PostComments rendered with:', { postId, comments, isLoading, error });
  }, [postId, comments, isLoading, error]);

  if (error) {
    console.error('Comments error:', error);
  }

  return (
    <div className="space-y-4">
      {/* Comments toggle button */}
      <Button
        variant="ghost"
        onClick={handleToggleComments}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <MessageSquare className="h-4 w-4" />
        <span>
          {comments.length === 0 
            ? 'No comments' 
            : `${comments.length} comment${comments.length > 1 ? 's' : ''}`
          }
        </span>
      </Button>

      {showComments && (
        <div className="space-y-4 border-t pt-4" onClick={(e) => e.stopPropagation()}>
          {/* Add comment form - Available to all authenticated users */}
          {user && (
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[80px] resize-none"
                disabled={isAddingComment}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!newComment.trim() || isAddingComment}
                  size="sm"
                >
                  {isAddingComment ? (
                    <>
                      <LoadingSpinner />
                      Posting...
                    </>
                  ) : (
                    'Post Comment'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Login prompt for non-authenticated users */}
          {!user && (
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Sign in to join the conversation
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/login">Sign In</a>
              </Button>
            </div>
          )}

          {/* Comments list */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">
                Error loading comments. Please try again.
              </p>
            ) : comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {user ? 'No comments yet. Be the first to comment!' : 'No comments yet.'}
              </p>
            ) : (
              comments.map((comment) => {
                // Safely access user data with null checks
                const username = comment.users?.username || 'Unknown User';
                const profilePicture = comment.users?.profile_picture || null;
                const userInitial = username.charAt(0).toUpperCase();

                return (
                  <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={profilePicture || undefined} 
                        alt={username} 
                      />
                      <AvatarFallback>
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeDate(comment.created_at)}
                          </span>
                        </div>
                        
                        {/* Allow users to delete their own comments */}
                        {user?.id === comment.user_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteComment(e, comment.id)}
                            className="h-6 w-6 p-0 hover:bg-destructive/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
