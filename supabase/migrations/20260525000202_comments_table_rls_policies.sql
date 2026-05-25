-- comments table had RLS enabled but zero policies — completely blocked.
-- Every comment read and write for creator posts was silently failing.

-- Anyone can read comments on published/scheduled posts
CREATE POLICY "Anyone can view comments on published posts"
  ON public.comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = comments.post_id
      AND p.status IN ('published', 'scheduled')
    )
  );

-- Authenticated users can add comments
CREATE POLICY "Authenticated users can insert comments"
  ON public.comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
