-- Create security definer function to safely check creator commission status
CREATE OR REPLACE FUNCTION public.get_creator_commission_status(p_creator_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.commission_types ct
    WHERE ct.creator_id = p_creator_id AND ct.is_active = true
  );
END;
$$;

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Anyone can view creators with active commission types" ON public.creators;
DROP POLICY IF EXISTS "Customers can view creators they have commission requests with" ON public.creators;

-- Create new safe policies for creators table
CREATE POLICY "Public can view creator profiles" 
ON public.creators 
FOR SELECT 
USING (true);

CREATE POLICY "Creators with active commissions are visible" 
ON public.creators 
FOR SELECT 
USING (get_creator_commission_status(id));

-- Ensure the existing commission types policy is safe (update if needed)
DROP POLICY IF EXISTS "Anyone can view active commission types" ON public.commission_types;

CREATE POLICY "Anyone can view active commission types" 
ON public.commission_types 
FOR SELECT 
USING (is_active = true);