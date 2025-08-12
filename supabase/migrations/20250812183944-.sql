-- Enable RLS and add strict policies for legacy commission table
-- This locks down access similarly to commission_requests

-- Ensure table exists and enable RLS
ALTER TABLE IF EXISTS public.commission ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view their own commissions" ON public.commission;
DROP POLICY IF EXISTS "Customers can create commissions" ON public.commission;
DROP POLICY IF EXISTS "Users can update their commissions" ON public.commission;
DROP POLICY IF EXISTS "Customers can delete their pending/rejected commissions" ON public.commission;

-- SELECT: creator (by ownership) or the customer can view
CREATE POLICY "Users can view their own commissions"
ON public.commission
FOR SELECT
USING (
  (creator_id IN (
    SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid()
  ))
  OR (auth.uid() = customer_id)
);

-- INSERT: only the customer (requester) can create
CREATE POLICY "Customers can create commissions"
ON public.commission
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- UPDATE: creator (by ownership) or the customer can update
CREATE POLICY "Users can update their commissions"
ON public.commission
FOR UPDATE
USING (
  (creator_id IN (
    SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid()
  ))
  OR (auth.uid() = customer_id)
)
WITH CHECK (
  (creator_id IN (
    SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid()
  ))
  OR (auth.uid() = customer_id)
);

-- DELETE: only customers, and only for safe statuses
CREATE POLICY "Customers can delete their pending/rejected commissions"
ON public.commission
FOR DELETE
USING (
  auth.uid() = customer_id
  AND status IN ('pending', 'rejected', 'payment_pending')
);
