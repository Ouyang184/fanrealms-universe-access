# Product Comments Design

## Goal
Add open comments to marketplace product pages so any signed-in user can ask questions, and creators can reply with a visible "Creator" badge. Includes a Community tab on the product detail page.

## Architecture
Single `product_comments` table with a `parent_id` for one level of replies. Frontend follows the same RPC-fetch pattern used by the forum (`get_public_user_profiles`). The product detail page gains a tab bar (About / Community) with the comment count shown live in the tab.

## Tech Stack
- Supabase PostgreSQL + RLS
- React 18 + TanStack Query
- Tailwind CSS (matches existing component style)

---

## Data Layer

### Table: `product_comments`

```sql
CREATE TABLE public.product_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  parent_id   uuid REFERENCES public.product_comments(id) ON DELETE SET NULL,
  is_deleted  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

**Constraints:**
- `parent_id` must reference a top-level comment (no grandchildren). Enforced by a CHECK constraint via trigger: if `parent_id` is set, the referenced row must itself have `parent_id IS NULL`.
- Content 1–2,000 characters.

### Indexes

```sql
CREATE INDEX product_comments_product_id_idx ON public.product_comments(product_id);
CREATE INDEX product_comments_parent_id_idx  ON public.product_comments(parent_id);
```

### RLS Policies

```sql
ALTER TABLE public.product_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Anyone can view product comments"
  ON public.product_comments FOR SELECT USING (true);

-- Signed-in users can post
CREATE POLICY "Authenticated users can insert comments"
  ON public.product_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Author can soft-delete their own comment
CREATE POLICY "Authors can delete own comments"
  ON public.product_comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Creator of the product can soft-delete any comment (moderation)
CREATE POLICY "Creators can moderate comments on their products"
  ON public.product_comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_products dp
      JOIN public.creators c ON c.id = dp.creator_id
      WHERE dp.id = product_comments.product_id
        AND c.user_id = auth.uid()
    )
  );
```

---

## Frontend

### File structure

```
src/
  components/
    comments/
      ProductCommentsSection.tsx   -- container: fetches, renders thread list + CommentBox
      CommentThread.tsx            -- one top-level comment + its replies
      CommentBox.tsx               -- textarea + submit, "Reply to X" label for replies
  hooks/
    useProductComments.ts          -- TanStack Query hooks: fetch, post, soft-delete
```

### `useProductComments(productId)`

**Fetch query** (`product-comments-{productId}`):
1. SELECT all non-deleted comments for the product, ordered by `created_at ASC`.
2. Batch-fetch author profiles via existing `get_public_user_profiles` RPC.
3. Return flat array annotated with author profile. Consumer groups into threads.

Also expose `isCreator(productId, userId)` — derived from product's `creator.user_id` — so `CommentThread` can badge the creator without an extra query.

**Mutations:**
- `postComment(productId, content, parentId?)` — INSERT, invalidates query on success.
- `deleteComment(commentId)` — UPDATE `is_deleted = true`, invalidates query on success.

### `CommentBox`

- Textarea, max 2,000 chars, shows char count when > 1,800.
- When `replyingTo` prop is set, shows "Replying to **username** · [cancel]" above textarea.
- Submit disabled when empty or while pending.
- Signed-out visitors see: "Log in to join the discussion" with a link to `/login?returnTo=current-path`.

### `CommentThread`

- Renders the top-level comment.
- Below it, indented with a left border, renders each reply in chronological order.
- **Creator badge:** if `comment.author_id === product.creator.user_id`, show a small purple "Creator" chip next to the username.
- Deleted comments render: `<p className="text-muted-foreground italic text-sm">This comment was removed.</p>` — replies below it remain visible.
- "Reply" button on top-level comments opens `CommentBox` inline (one at a time — opening a new reply box closes the previous).
- Author and creator can see a "Remove" (trash icon) button on their own comments.

### `ProductCommentsSection`

- Groups flat comment array into `{ topLevel: Comment[], replies: Map<string, Comment[]> }`.
- Renders `CommentThread` for each top-level comment.
- `CommentBox` at the bottom for new top-level comments.
- Empty state: "No comments yet. Be the first to ask a question."
- Loading state: 3 skeleton rows.

### ProductDetail page changes

Add a tab bar below the title row:

```
[ About ]   [ Community (n) ]
```

- Tab state: `?tab=community` in URL query string (default: `about`).
- **About tab:** existing description + `ProductRatingsSection` (unchanged).
- **Community tab:** `ProductCommentsSection`.
- Comment count in tab label comes from `useProductComments` — shows total non-deleted comment count (top-level + replies combined).

---

## Error handling

- Post fails → toast "Failed to post comment. Please try again."
- Delete fails → toast "Failed to remove comment."
- Network error on fetch → inline error state with retry button.

---

## Out of scope

- Notifications (creator notified of new comments) — future feature.
- Editing comments after posting — keep it simple, delete and re-post.
- Reporting/flagging comments — future moderation feature.
- Markdown in comments — plain text only to keep it simple.
- Pagination — load all comments (reasonable for a marketplace product; revisit if counts get large).
