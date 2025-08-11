-- Re-apply plan excluding commission view changes

-- 1) Messages: replace broad ALL policy with granular ones
DROP POLICY IF EXISTS "Optimized messages access" ON public.messages;

CREATE POLICY "Users can insert own messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Participants can select their messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Participants can update their messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Senders can delete their messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);

-- 3) Likes: restrict visibility and provide safe aggregate
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;

DROP POLICY IF EXISTS "Users and post authors can view likes" ON public.likes;
CREATE POLICY "Users and post authors can view likes"
ON public.likes
FOR SELECT
USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = public.likes.post_id AND p.author_id = auth.uid()
  )
);

-- Public-safe like count function
CREATE OR REPLACE FUNCTION public.get_post_like_count(post_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer FROM public.likes WHERE post_id = post_id_param;
$$;

-- 4) Posts: protect premium content; allow public access to free published posts only
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;

DROP POLICY IF EXISTS "Public can view free published posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can view their posts" ON public.posts;
DROP POLICY IF EXISTS "Subscribers can view paid published posts" ON public.posts;

CREATE POLICY "Public can view free published posts"
ON public.posts
FOR SELECT
USING (
  status = 'published'::text
  AND tier_id IS NULL
  AND (scheduled_for IS NULL OR scheduled_for <= now())
);

CREATE POLICY "Authors can view their posts"
ON public.posts
FOR SELECT
USING (auth.uid() = author_id);

CREATE POLICY "Subscribers can view paid published posts"
ON public.posts
FOR SELECT
USING (
  status = 'published'::text
  AND tier_id IS NOT NULL
  AND (scheduled_for IS NULL OR scheduled_for <= now())
  AND user_has_tier_access(tier_id)
);
