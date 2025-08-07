-- Fix the RLS policy for commission_types table that's causing the update error
-- The current policy has issues with set-returning functions in WHERE clauses

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Creators can manage their own commission types" ON public.commission_types;

-- Create a new, simpler policy that works correctly
CREATE POLICY "Creators can manage their own commission types" 
ON public.commission_types 
FOR ALL 
USING (
  creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  )
);