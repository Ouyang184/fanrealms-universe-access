// src/components/comments/CommentThread.tsx
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSoftDeleteComment, usePostComment } from '@/hooks/useProductComments';
import { CommentBox } from './CommentBox';
import { toast } from 'sonner';
import type { ProductComment } from '@/hooks/useProductComments';

interface CommentThreadProps {
  comment: ProductComment;
  replies: ProductComment[];
  productId: string;
  creatorUserId: string | null;
  currentPath: string;
}

function CommentBubble({
  comment,
  productId,
  creatorUserId,
  isReply,
  onReply,
}: {
  comment: ProductComment;
  productId: string;
  creatorUserId: string | null;
  isReply: boolean;
  onReply?: () => void;
}) {
  const { user } = useAuth();
  const deleteMutation = useSoftDeleteComment(productId);

  const isCreator = !!creatorUserId && comment.author_id === creatorUserId;
  const canDelete =
    !!user &&
    (user.id === comment.author_id ||
      (!!creatorUserId && user.id === creatorUserId));

  const displayName =
    comment.author?.display_name ||
    comment.author?.username ||
    'Deleted user';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(comment.id);
    } catch {
      toast.error('Failed to remove comment.');
    }
  };

  if (comment.is_deleted) {
    return (
      <p className="text-[12px] text-muted-foreground italic py-1">
        This comment was removed.
      </p>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-foreground/10 flex items-center justify-center text-[10px] font-bold text-foreground/60">
        {comment.author?.profile_picture ? (
          <img src={comment.author.profile_picture} alt="" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] font-semibold text-foreground">{displayName}</span>
          {isCreator && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              Creator
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-[13px] text-foreground leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
        <div className="flex items-center gap-3 mt-1">
          {!isReply && onReply && (
            <button
              onClick={onReply}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              Reply
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentThread({
  comment,
  replies,
  productId,
  creatorUserId,
  currentPath,
}: CommentThreadProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const postMutation = usePostComment(productId);

  const handleReply = async (content: string) => {
    try {
      await postMutation.mutateAsync({ content, parentId: comment.id });
      setShowReplyBox(false);
    } catch {
      toast.error('Failed to post reply. Please try again.');
    }
  };

  return (
    <div className="space-y-3">
      <CommentBubble
        comment={comment}
        productId={productId}
        creatorUserId={creatorUserId}
        isReply={false}
        onReply={() => setShowReplyBox((v) => !v)}
      />

      {replies.length > 0 && (
        <div className="ml-9 space-y-3 border-l-2 border-border pl-4">
          {replies.map((reply) => (
            <CommentBubble
              key={reply.id}
              comment={reply}
              productId={productId}
              creatorUserId={creatorUserId}
              isReply={true}
            />
          ))}
        </div>
      )}

      {showReplyBox && (
        <div className="ml-9">
          <CommentBox
            onSubmit={handleReply}
            isSubmitting={postMutation.isPending}
            replyingTo={comment.author}
            onCancelReply={() => setShowReplyBox(false)}
            returnTo={currentPath}
          />
        </div>
      )}
    </div>
  );
}
