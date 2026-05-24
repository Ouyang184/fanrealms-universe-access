-- Fix RLS policies on product_comments to restrict UPDATE to is_deleted only.
-- Also fix trigger function search_path for security consistency.

-- Drop and recreate the author soft-delete policy with restrictive WITH CHECK
DROP POLICY IF EXISTS "Authors can soft-delete own comments" ON public.product_comments;
CREATE POLICY "Authors can soft-delete own comments"
  ON public.product_comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (
    auth.uid() = author_id
    AND is_deleted = true
  );

-- Drop and recreate the creator moderation policy with WITH CHECK
DROP POLICY IF EXISTS "Creators can moderate comments on their products" ON public.product_comments;
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
  )
  WITH CHECK (
    is_deleted = true
    AND EXISTS (
      SELECT 1
      FROM public.digital_products dp
      JOIN public.creators c ON c.id = dp.creator_id
      WHERE dp.id = product_comments.product_id
        AND c.user_id = auth.uid()
    )
  );

-- Recreate trigger function with SET search_path for security
CREATE OR REPLACE FUNCTION public.check_comment_depth()
RETURNS trigger LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
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
