// src/components/comments/ProductCommentsSection.tsx
import { useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import {
  useProductComments,
  usePostComment,
  groupCommentThreads,
} from '@/hooks/useProductComments';
import { CommentThread } from './CommentThread';
import { CommentBox } from './CommentBox';
import { toast } from 'sonner';

interface ProductCommentsSectionProps {
  productId: string;
  creatorUserId: string | null;
}

export function ProductCommentsSection({
  productId,
  creatorUserId,
}: ProductCommentsSectionProps) {
  const location = useLocation();
  const currentPath = location.pathname + location.search;

  const { data: comments, isLoading, isError } = useProductComments(productId);
  const postMutation = usePostComment(productId);

  const threads = groupCommentThreads(comments ?? []);

  const handlePost = async (content: string) => {
    try {
      await postMutation.mutateAsync({ content, parentId: null });
    } catch {
      toast.error('Failed to post comment. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-[15px] font-bold tracking-[-0.3px] flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Community
        {comments && comments.length > 0 && (
          <span className="text-[13px] font-normal text-muted-foreground">
            ({comments.filter((c) => !c.is_deleted).length})
          </span>
        )}
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2.5 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="text-[13px] text-destructive">
          Failed to load comments.
        </p>
      ) : threads.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          No comments yet. Be the first to ask a question.
        </p>
      ) : (
        <div className="space-y-6 divide-y divide-border">
          {threads.map(({ comment, replies }) => (
            <div key={comment.id} className="pt-4 first:pt-0">
              <CommentThread
                comment={comment}
                replies={replies}
                productId={productId}
                creatorUserId={creatorUserId}
                currentPath={currentPath}
              />
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-4">
        <CommentBox
          onSubmit={handlePost}
          isSubmitting={postMutation.isPending}
          returnTo={currentPath}
        />
      </div>
    </div>
  );
}
