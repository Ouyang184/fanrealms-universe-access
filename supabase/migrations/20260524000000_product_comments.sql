-- supabase/migrations/20260524000000_product_comments.sql

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

CREATE INDEX product_comments_product_id_idx ON public.product_comments(product_id);
CREATE INDEX product_comments_parent_id_idx  ON public.product_comments(parent_id);

ALTER TABLE public.product_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product comments"
  ON public.product_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON public.product_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can soft-delete own comments"
  ON public.product_comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

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

GRANT SELECT, INSERT, UPDATE ON public.product_comments TO authenticated;
GRANT SELECT ON public.product_comments TO anon;
