
-- Update the RLS policy to allow deletion of payment_pending requests as well
DROP POLICY IF EXISTS "Customers can delete their own pending or rejected requests" ON public.commission_requests;

CREATE POLICY "Customers can delete their own pending, rejected, or payment_pending requests" 
ON public.commission_requests 
FOR DELETE 
USING (
  customer_id = auth.uid() 
  AND status IN ('pending', 'rejected', 'payment_pending')
);
