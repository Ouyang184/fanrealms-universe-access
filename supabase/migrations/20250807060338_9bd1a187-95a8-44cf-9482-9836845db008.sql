-- Check current policies on commission_types
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'commission_types';

-- Drop all existing policies on commission_types  
DROP POLICY IF EXISTS "Creators can manage their own commission types" ON public.commission_types;

-- Create a simpler, working policy
CREATE POLICY "Enable all operations for creators on their commission types"
ON public.commission_types
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.creators 
    WHERE creators.id = commission_types.creator_id 
    AND creators.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.creators 
    WHERE creators.id = commission_types.creator_id 
    AND creators.user_id = auth.uid()
  )
);