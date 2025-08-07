-- First, let's drop the existing policy and create a security definer function
DROP POLICY IF EXISTS "Enable all operations for creators on their commission types" ON public.commission_types;

-- Create a security definer function to check if user owns the creator profile
CREATE OR REPLACE FUNCTION public.user_owns_creator_profile(creator_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.creators 
    WHERE creators.id = creator_id_param 
    AND creators.user_id = auth.uid()
  );
END;
$$;

-- Create a simpler RLS policy using the security definer function
CREATE POLICY "Creators can manage their commission types"
ON public.commission_types
FOR ALL
TO authenticated
USING (public.user_owns_creator_profile(creator_id))
WITH CHECK (public.user_owns_creator_profile(creator_id));