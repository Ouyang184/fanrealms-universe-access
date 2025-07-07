
-- Add RLS policy to allow customers to delete their own commission requests
-- Only allow deletion of pending or rejected requests for safety
CREATE POLICY "Customers can delete their own pending or rejected requests" 
ON public.commission_requests 
FOR DELETE 
USING (
  customer_id = auth.uid() 
  AND status IN ('pending', 'rejected')
);
