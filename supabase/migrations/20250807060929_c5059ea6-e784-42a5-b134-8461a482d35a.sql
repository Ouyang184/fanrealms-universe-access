-- Temporarily test without RLS to isolate the issue
DROP POLICY IF EXISTS "Creators can manage their commission types" ON public.commission_types;

-- Create a direct RLS policy without using a function
CREATE POLICY "Creators can manage their commission types direct"
ON public.commission_types
FOR ALL
TO authenticated
USING (
  creator_id IN (
    SELECT id FROM public.creators 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  creator_id IN (
    SELECT id FROM public.creators 
    WHERE user_id = auth.uid()
  )
);