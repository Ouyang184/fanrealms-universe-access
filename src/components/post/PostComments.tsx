
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
    addComment, 
    deleteComment, 
    isAddingComment 
  } = useComments(postId);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    addComment(newComment.trim());
    setNewComment('');
  };

  return (
    <div className="space-y-4">
      {/* Comments toggle button */}
      <Button
        variant="ghost"
        onClick={() => setShowComments(!showComments)}
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
        <div className="space-y-4 border-t pt-4">
          {/* Add comment form */}
          {user && (
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[80px] resize-none"
                disabled={isAddingComment}
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

          {/* Comments list */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {user ? 'Be the first to comment!' : 'No comments yet.'}
              </p>
            ) : (
              comments.map((comment) => {
                // Safely extract user data with null checks
                const username = comment.users?.username || 'Unknown User';
                const profilePicture = comment.users?.profile_picture || undefined;
                
                return (
                  <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={profilePicture} 
                        alt={username} 
                      />
                      <AvatarFallback>
                        {username.charAt(0).toUpperCase()}
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
                        
                        {user?.id === comment.user_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteComment(comment.id)}
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
