# Product Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add open comments (any signed-in user) + creator replies + Community tab to marketplace product pages.

**Architecture:** New `product_comments` table with soft-delete and one-level reply constraint. Frontend follows the existing hook+component pattern from `useProductRatings` / `ProductRatingsSection`. ProductDetail gains an About/Community tab bar with `?tab=` URL state.

**Tech Stack:** Supabase PostgreSQL + RLS, React 18, TanStack Query, Tailwind CSS, existing `get_public_user_profiles` RPC.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260524000000_product_comments.sql` | Create | DB table + indexes + RLS |
| `src/hooks/useProductComments.ts` | Create | Fetch / post / soft-delete hooks |
| `src/components/comments/CommentBox.tsx` | Create | Textarea + submit button |
| `src/components/comments/CommentThread.tsx` | Create | One top-level comment + its replies |
| `src/components/comments/ProductCommentsSection.tsx` | Create | Container: groups threads, renders list |
| `src/pages/ProductDetail.tsx` | Modify | Add About/Community tab bar |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260524000000_product_comments.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260524000000_product_comments.sql

-- Table
CREATE TABLE public.product_comments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid        NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  author_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  parent_id   uuid        REFERENCES public.product_comments(id) ON DELETE SET NULL,
  is_deleted  boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Prevent grandchildren: replies cannot themselves have replies
CREATE OR REPLACE FUNCTION public.check_comment_depth()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.product_comments
      WHERE id = NEW.parent_id AND parent_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Comments can only be nested one level deep';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_comment_depth
  BEFORE INSERT ON public.product_comments
  FOR EACH ROW EXECUTE FUNCTION public.check_comment_depth();

-- Indexes
CREATE INDEX product_comments_product_id_idx ON public.product_comments(product_id);
CREATE INDEX product_comments_parent_id_idx  ON public.product_comments(parent_id);

-- RLS
ALTER TABLE public.product_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can view product comments"
  ON public.product_comments FOR SELECT
  USING (true);

-- Signed-in users can insert
CREATE POLICY "Authenticated users can insert comments"
  ON public.product_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Authors can soft-delete their own comment
CREATE POLICY "Authors can soft-delete own comments"
  ON public.product_comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Creators can soft-delete any comment on their products (moderation)
CREATE POLICY "Creators can moderate comments on their products"
  ON public.product_comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.digital_products dp
      JOIN public.creators c ON c.id = dp.creator_id
      WHERE dp.id = product_comments.product_id
        AND c.user_id = auth.uid()
    )
  );

-- Grant to roles
GRANT SELECT, INSERT, UPDATE ON public.product_comments TO authenticated;
GRANT SELECT ON public.product_comments TO anon;
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `mcp__plugin_supabase_supabase__apply_migration` tool with:
- `project_id`: `eaeqyctjljbtcatlohky`
- `name`: `product_comments`
- `query`: the full SQL above

- [ ] **Step 3: Verify the table exists**

Run this SQL via `mcp__plugin_supabase_supabase__execute_sql`:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_comments'
ORDER BY ordinal_position;
```
Expected: 8 rows (id, product_id, author_id, content, parent_id, is_deleted, created_at, updated_at).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260524000000_product_comments.sql
git commit -m "feat: add product_comments table with RLS and depth trigger"
```

---

## Task 2: `useProductComments` hook

**Files:**
- Create: `src/hooks/useProductComments.ts`

**Context:** Follow the pattern in `src/hooks/useProductRatings.ts`. Use `@/lib/supabase` for the supabase client. The `get_public_user_profiles` RPC (used by `src/hooks/useForum.ts`) batch-fetches `{ id, username, display_name, profile_picture }` for a list of user UUIDs — use the same approach here.

- [ ] **Step 1: Create the hook file**

```typescript
// src/hooks/useProductComments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface CommentAuthor {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_picture: string | null;
}

export interface ProductComment {
  id: string;
  product_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author: CommentAuthor | null;
}

export interface CommentThread {
  comment: ProductComment;
  replies: ProductComment[];
}

async function fetchAuthorProfiles(
  authorIds: string[]
): Promise<Map<string, CommentAuthor>> {
  const uniqueIds = [...new Set(authorIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();
  const { data } = await supabase.rpc('get_public_user_profiles', {
    _user_ids: uniqueIds,
  });
  return new Map(
    ((data as CommentAuthor[]) ?? []).map((u) => [u.id, u])
  );
}

export function useProductComments(productId: string) {
  return useQuery({
    queryKey: ['product-comments', productId],
    enabled: !!productId,
    staleTime: 1000 * 30,
    queryFn: async (): Promise<ProductComment[]> => {
      const { data, error } = await supabase
        .from('product_comments')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const authorsMap = await fetchAuthorProfiles(
        data.map((c) => c.author_id)
      );
      return data.map((c) => ({
        ...c,
        author: authorsMap.get(c.author_id) ?? null,
      })) as ProductComment[];
    },
  });
}

/** Groups a flat comment list into top-level threads with their replies. */
export function groupCommentThreads(comments: ProductComment[]): CommentThread[] {
  const topLevel = comments.filter((c) => c.parent_id === null);
  const repliesMap = new Map<string, ProductComment[]>();
  for (const c of comments) {
    if (c.parent_id) {
      const list = repliesMap.get(c.parent_id) ?? [];
      list.push(c);
      repliesMap.set(c.parent_id, list);
    }
  }
  return topLevel.map((c) => ({
    comment: c,
    replies: repliesMap.get(c.id) ?? [],
  }));
}

export function usePostComment(productId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      parentId,
    }: {
      content: string;
      parentId?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('product_comments').insert({
        product_id: productId,
        author_id: user.id,
        content: content.trim(),
        parent_id: parentId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-comments', productId] });
    },
  });
}

export function useSoftDeleteComment(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('product_comments')
        .update({ is_deleted: true })
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-comments', productId] });
    },
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors related to `useProductComments.ts`. (Ignore pre-existing errors in other files.)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useProductComments.ts
git commit -m "feat: add useProductComments hook"
```

---

## Task 3: `CommentBox` component

**Files:**
- Create: `src/components/comments/CommentBox.tsx`

**Context:** Simple textarea + submit. When `replyingTo` prop is provided, shows "Replying to username · cancel" header. Match existing component style: `rounded-xl border border-border bg-card p-4`, buttons use the existing `Button` component from `@/components/ui/button`.

- [ ] **Step 1: Create the component**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/comments/CommentBox.tsx
git commit -m "feat: add CommentBox component"
```

---

## Task 4: `CommentThread` component

**Files:**
- Create: `src/components/comments/CommentThread.tsx`

**Context:** Renders one top-level `ProductComment` and its replies. The `creatorUserId` prop is the `user_id` of the product's creator (from `product.creators.user_id`) — if a comment's `author_id` matches this, show a "Creator" badge. Uses `useSoftDeleteComment` and `useAuth` to show a remove button to the author and creator.

- [ ] **Step 1: Create the component**

```typescript
// src/components/comments/CommentThread.tsx
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSoftDeleteComment } from '@/hooks/useProductComments';
import { CommentBox } from './CommentBox';
import type { ProductComment } from '@/hooks/useProductComments';
import { toast } from 'sonner';

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
  currentPath,
  onReply,
}: {
  comment: ProductComment;
  productId: string;
  creatorUserId: string | null;
  isReply: boolean;
  currentPath: string;
  onReply?: () => void;
}) {
  const { user } = useAuth();
  const deleteMutation = useSoftDeleteComment(productId);

  const isCreator = creatorUserId && comment.author_id === creatorUserId;
  const canDelete =
    user &&
    (user.id === comment.author_id ||
      (creatorUserId && user.id === creatorUserId));

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
    <div className="space-y-1.5">
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-foreground/10 flex items-center justify-center text-[10px] font-bold text-foreground/60">
          {comment.author?.profile_picture ? (
            <img
              src={comment.author.profile_picture}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] font-semibold text-foreground">
              {displayName}
            </span>
            {isCreator && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                Creator
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Content */}
          <p className="text-[13px] text-foreground leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Actions */}
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
  const postMutation = usePostCommentForThread(productId);

  // Import inside component to avoid circular — handled via re-export in hook
  function usePostCommentForThread(pid: string) {
    const { usePostComment } = require('@/hooks/useProductComments');
    return usePostComment(pid);
  }

  const handleReply = async (content: string) => {
    await postMutation.mutateAsync({ content, parentId: comment.id });
    setShowReplyBox(false);
  };

  return (
    <div className="space-y-3">
      <CommentBubble
        comment={comment}
        productId={productId}
        creatorUserId={creatorUserId}
        isReply={false}
        currentPath={currentPath}
        onReply={() => setShowReplyBox((v) => !v)}
      />

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-9 space-y-3 border-l-2 border-border pl-4">
          {replies.map((reply) => (
            <CommentBubble
              key={reply.id}
              comment={reply}
              productId={productId}
              creatorUserId={creatorUserId}
              isReply={true}
              currentPath={currentPath}
            />
          ))}
        </div>
      )}

      {/* Reply box */}
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
```

**Note:** The `require()` trick above is a workaround to avoid a circular import. Replace it by importing `usePostComment` at the top of the file instead — the real implementation should do:

```typescript
import { useSoftDeleteComment, usePostComment } from '@/hooks/useProductComments';
```

And pass `postMutation` as a prop or call `usePostComment(productId)` at the top of `CommentThread` directly (not inside the function). Here is the corrected `CommentThread` without the require hack:

```typescript
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
    await postMutation.mutateAsync({ content, parentId: comment.id });
    setShowReplyBox(false);
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/comments/CommentThread.tsx
git commit -m "feat: add CommentThread component"
```

---

## Task 5: `ProductCommentsSection` component

**Files:**
- Create: `src/components/comments/ProductCommentsSection.tsx`

**Context:** Container that fetches all comments, groups them into threads, and renders the list plus a `CommentBox` at the bottom. The `product` prop needs `id`, `creators.user_id` to pass `creatorUserId` to threads. Use `useLocation` from `react-router-dom` to get the current path for the login redirect URL.

- [ ] **Step 1: Create the component**

```typescript
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

      {/* Comment list */}
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

      {/* New comment box */}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/comments/ProductCommentsSection.tsx
git commit -m "feat: add ProductCommentsSection container"
```

---

## Task 6: Add About / Community tabs to ProductDetail

**Files:**
- Modify: `src/pages/ProductDetail.tsx`

**Context:** The current layout is:
```
<MainLayout>
  <div className="max-w-5xl mx-auto space-y-8">
    {/* back button */}
    {/* title row */}
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 ...">
      {/* LEFT: gallery + description + ratings */}
      {/* RIGHT: sidebar */}
    </div>
  </div>
</MainLayout>
```

Add a tab bar **between the title row and the main grid**. The `tab` value comes from `?tab=` URL query param (default `'about'`). Use `useSearchParams` from `react-router-dom`.

- [ ] **Step 1: Add imports to ProductDetail.tsx**

At the top of `src/pages/ProductDetail.tsx`, add to the existing imports:

```typescript
import { useSearchParams } from 'react-router-dom';
import { ProductCommentsSection } from '@/components/comments/ProductCommentsSection';
```

- [ ] **Step 2: Add tab state inside the component**

Inside `ProductDetail` function, after the existing hooks, add:

```typescript
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = (searchParams.get('tab') ?? 'about') as 'about' | 'community';

const { data: comments } = useProductComments(p?.id ?? '');
const commentCount = (comments ?? []).filter((c) => !c.is_deleted).length;
```

Also add this import at the top:
```typescript
import { useProductComments } from '@/hooks/useProductComments';
```

- [ ] **Step 3: Replace the main grid section**

Find the current grid opening tag (around line 114):
```tsx
{/* Main grid */}
<div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start lg:grid-flow-col">
```

Replace the entire grid section (the `<div className="grid ...">` and its contents — everything up to and including the closing `</div>` before `</div> </MainLayout>`) with this:

```tsx
{/* Tab bar */}
<div className="flex gap-1 border-b border-border">
  <button
    onClick={() => setSearchParams(activeTab === 'about' ? {} : { tab: 'about' })}
    className={`px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
      activeTab === 'about'
        ? 'border-primary text-primary'
        : 'border-transparent text-muted-foreground hover:text-foreground'
    }`}
  >
    About
  </button>
  <button
    onClick={() => setSearchParams({ tab: 'community' })}
    className={`px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
      activeTab === 'community'
        ? 'border-primary text-primary'
        : 'border-transparent text-muted-foreground hover:text-foreground'
    }`}
  >
    Community
    {commentCount > 0 && (
      <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
        ({commentCount})
      </span>
    )}
  </button>
</div>

{/* Main grid */}
<div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start lg:grid-flow-col">

  {/* LEFT: tab content */}
  <div className="space-y-3">
    {activeTab === 'about' ? (
      <>
        {/* Image gallery */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
            {allImages.length > 0 ? (
              <img src={allImages[activeImg]} alt={p.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Package className="w-12 h-12 opacity-30" />
              </div>
            )}
            {allImages.length > 1 && (
              <>
                <button onClick={() => setActiveImg(i => (i - 1 + allImages.length) % allImages.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setActiveImg(i => (i + 1) % allImages.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {allImages.map((_, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeImg ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`flex-shrink-0 w-16 h-10 rounded-md overflow-hidden border-2 transition-colors ${i === activeImg ? 'border-primary' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {p.description && (
          <div className="pt-4">
            <h2 className="text-[15px] font-bold text-foreground mb-3">About this asset</h2>
            <MarkdownContent>{p.description}</MarkdownContent>
          </div>
        )}

        {/* Ratings */}
        <div className="border-t border-border pt-6 mt-6">
          <ProductRatingsSection productId={p.id} />
        </div>
      </>
    ) : (
      <ProductCommentsSection
        productId={p.id}
        creatorUserId={p.creators?.user_id ?? null}
      />
    )}
  </div>

  {/* RIGHT: sticky sidebar — same as before, always visible */}
  <aside className="lg:sticky lg:top-20 space-y-4 order-first lg:order-last">

    {/* Price + CTA card */}
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        {isFree ? (
          <div className="text-[32px] font-bold text-green-600">Free</div>
        ) : (
          <div className="text-[32px] font-bold text-foreground">${Number(p.price).toFixed(2)}</div>
        )}
      </div>

      {canDownload ? (
        <Button size="lg" className="w-full" onClick={handleDownload} disabled={downloading}>
          {downloading
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Getting link…</>
            : <><Download className="h-4 w-4 mr-2" />{isFree ? 'Download' : 'Download your purchase'}</>
          }
        </Button>
      ) : user ? (
        <Button size="lg" className="w-full" onClick={() => checkout(p.id)} disabled={checkoutLoading}>
          {checkoutLoading ? 'Redirecting…' : `Buy Now — $${Number(p.price).toFixed(2)}`}
        </Button>
      ) : (
        <div className="space-y-2">
          <Button size="lg" className="w-full" asChild>
            <Link to={`/login?returnTo=${encodeURIComponent(`/marketplace/${productId}`)}`}>
              Sign in to {isFree ? 'download' : 'buy'}
            </Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link to="/signup" className="text-primary hover:underline">Create a free account</Link>
          </p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center">
        {isFree ? 'Free forever · no account required to browse' : 'Secure checkout via Stripe · instant download'}
      </p>
    </div>

    {/* Asset details */}
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wide">Details</h3>

      {p.category && (
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground flex items-center gap-1.5"><Package className="w-3.5 h-3.5" />Category</span>
          <span className="font-medium">{p.category}</span>
        </div>
      )}

      {p.godot_version && (
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Godot</span>
          <span className="font-medium">{p.godot_version}</span>
        </div>
      )}

      {p.version && (
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Version</span>
          <span className="font-medium">{p.version}</span>
        </div>
      )}

      {p.license && (
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />License</span>
          <span className="font-medium text-right max-w-[140px]">{p.license}</span>
        </div>
      )}

      {p.tags?.length > 0 && (
        <div className="pt-1">
          <span className="text-[12px] text-muted-foreground flex items-center gap-1.5 mb-2"><Tag className="w-3.5 h-3.5" />Tags</span>
          <div className="flex flex-wrap gap-1">
            {p.tags.map((t: string) => (
              <Badge key={t} variant="secondary" className="text-[11px]">{t}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Creator card */}
    {p.creators && (
      <Link to={`/${p.creators.username}`}
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors">
        {p.creators.profile_image_url ? (
          <img src={p.creators.profile_image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[14px]">
            {(p.creators.display_name || p.creators.username || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate">{p.creators.display_name || p.creators.username}</div>
          <div className="text-[11px] text-muted-foreground">View creator profile →</div>
        </div>
      </Link>
    )}
  </aside>
</div>
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ProductDetail.tsx
git commit -m "feat: add About/Community tabs to product detail page"
```

- [ ] **Step 6: Push to GitHub**

```bash
git push origin main
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ `product_comments` table with `parent_id`, `is_deleted`, content length check
- ✅ One-level depth enforced by trigger
- ✅ RLS: SELECT for all, INSERT for authenticated, UPDATE (soft-delete) for author + creator
- ✅ `useProductComments` fetch + `usePostComment` + `useSoftDeleteComment`
- ✅ `CommentBox` with login nudge, char count, reply header
- ✅ `CommentThread` with Creator badge, deleted placeholder, reply box toggle
- ✅ `ProductCommentsSection` with loading/empty/error states
- ✅ About / Community tab bar with `?tab=` URL state
- ✅ Comment count in tab label

**Type consistency:**
- `ProductComment.author` is `CommentAuthor | null` — used consistently in CommentThread and CommentBubble
- `CommentThread` (the grouped type) vs `CommentThread` (the component) — the type is in `useProductComments.ts`, the component in its own file. No collision since they're in different modules.
- `usePostComment` takes `{ content, parentId }` — matches how it's called in both `ProductCommentsSection` (parentId: null) and `CommentThread` (parentId: comment.id)
- `creatorUserId` is `string | null` throughout — consistent

**Placeholder scan:** No TBDs, TODOs, or vague steps.
