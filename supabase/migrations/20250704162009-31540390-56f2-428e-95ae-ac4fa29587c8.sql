
-- Add checkout_created status to commission requests
-- This allows us to track when a Stripe session is created but payment hasn't been attempted yet
UPDATE commission_requests 
SET status = 'checkout_created' 
WHERE status = 'payment_pending' AND stripe_payment_intent_id IS NOT NULL;

-- Update the RLS policy to include the new checkout_created status
DROP POLICY IF EXISTS "Customers can delete their own pending, rejected, or payment_pending requests" ON public.commission_requests;

CREATE POLICY "Customers can delete their own pending, rejected, payment_pending, or checkout_created requests" 
ON public.commission_requests 
FOR DELETE 
USING (
  customer_id = auth.uid() 
  AND status IN ('pending', 'rejected', 'payment_pending', 'checkout_created')
);
