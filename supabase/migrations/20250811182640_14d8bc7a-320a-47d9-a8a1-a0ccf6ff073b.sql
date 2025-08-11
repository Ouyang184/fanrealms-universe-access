-- Enable RLS on commission table and add secure policies
ALTER TABLE public.commission ENABLE ROW LEVEL SECURITY;

-- Users can view commissions where they are the customer or the creator (via creators.user_id)
CREATE POLICY "Users can view their commissions"
ON public.commission
FOR SELECT
USING (
  (customer_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.id = creator_id AND c.user_id = auth.uid()
  )
);

-- Customers can create their own commission records
CREATE POLICY "Customers can create commissions"
ON public.commission
FOR INSERT
WITH CHECK (customer_id = auth.uid());

-- Users can update commissions they are involved in
CREATE POLICY "Users can update their commissions"
ON public.commission
FOR UPDATE
USING (
  (customer_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.id = creator_id AND c.user_id = auth.uid()
  )
);

-- Note: No DELETE policy provided to prevent accidental removals; service role can still manage as needed.
