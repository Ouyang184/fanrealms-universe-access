-- Fix the search path issue in the function
CREATE OR REPLACE FUNCTION public.user_owns_creator_profile(creator_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.creators 
    WHERE creators.id = creator_id_param 
    AND creators.user_id = auth.uid()
  );
END;
$$;