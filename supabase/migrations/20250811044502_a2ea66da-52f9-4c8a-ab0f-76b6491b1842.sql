
-- Allow public read access to active commission types for creators who accept commissions
CREATE POLICY "Anyone can view active commission types"
  ON public.commission_types
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.creators c
      WHERE c.id = commission_types.creator_id
        AND c.accepts_commissions = true
    )
  );
