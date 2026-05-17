-- Feedback submitted via the in-app feedback button.
-- Anonymous submissions allowed (user_id nullable).

CREATE TABLE public.feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL CHECK (type IN ('bug', 'suggestion', 'other')),
  message     text NOT NULL,
  email       text,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can insert feedback
CREATE POLICY "Anyone can submit feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

-- Only the user can read their own feedback; anon rows are admin-only
CREATE POLICY "Users can read own feedback"
  ON public.feedback FOR SELECT TO authenticated
  USING (user_id = auth.uid());
