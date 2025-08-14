-- Allow customers to view creators they have commission requests with
CREATE POLICY "Customers can view creators they have commission requests with" 
ON public.creators FOR SELECT 
USING (
  id IN (
    SELECT creator_id 
    FROM public.commission_requests 
    WHERE customer_id = auth.uid()
  )
);

-- Also allow anyone to view basic creator info for active commission types (for commission type display)
CREATE POLICY "Anyone can view creators with active commission types" 
ON public.creators FOR SELECT 
USING (
  id IN (
    SELECT creator_id 
    FROM public.commission_types 
    WHERE is_active = true
  )
);