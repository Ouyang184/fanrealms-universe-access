// src/components/comments/CommentBox.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { X } from 'lucide-react';

interface CommentBoxProps {
  onSubmit: (content: string) => Promise<void>;
  isSubmitting: boolean;
  replyingTo?: { username: string | null; display_name: string | null } | null;
  onCancelReply?: () => void;
  placeholder?: string;
  returnTo?: string;
}

export function CommentBox({
  onSubmit,
  isSubmitting,
  replyingTo,
  onCancelReply,
  placeholder = 'Ask a question or leave a comment…',
  returnTo,
}: CommentBoxProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const MAX = 2000;

  if (!user) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[13px] text-muted-foreground">
          <Link
            to={`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
            className="text-primary font-medium hover:underline"
          >
            Log in
          </Link>{' '}
          to join the discussion.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    await onSubmit(content.trim());
    setContent('');
  };

  const authorName =
    replyingTo?.display_name || replyingTo?.username || 'user';

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {replyingTo && (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>
            Replying to{' '}
            <span className="font-semibold text-foreground">{authorName}</span>
          </span>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="ml-auto flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          )}
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX))}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
      />
      <div className="flex items-center justify-between">
        {content.length > 1800 ? (
          <span className="text-[11px] text-muted-foreground">
            {MAX - content.length} chars left
          </span>
        ) : (
          <span />
        )}
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? 'Posting…' : replyingTo ? 'Post Reply' : 'Post Comment'}
        </Button>
      </div>
    </form>
  );
}
