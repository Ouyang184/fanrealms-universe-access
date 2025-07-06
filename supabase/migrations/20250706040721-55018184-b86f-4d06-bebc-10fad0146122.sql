
-- Update commission_requests status constraint to include new statuses
ALTER TABLE commission_requests 
DROP CONSTRAINT IF EXISTS commission_requests_status_check;

ALTER TABLE commission_requests 
ADD CONSTRAINT commission_requests_status_check 
CHECK (status IN (
  'pending',           -- Initial request, no payment
  'accepted',          -- Creator accepted, awaiting payment
  'paid',              -- Customer completed payment
  'rejected',
  'in_progress',
  'completed',
  'delivered',
  'under_review',
  'revision_requested',
  'cancelled',
  'refunded'
));

-- Remove stripe_payment_intent_id from commission_requests as it won't be needed until after acceptance
-- We'll keep the column but it will be populated later in the flow

-- Update RLS policy to allow customers to delete pending and rejected requests (no payment involved)
DROP POLICY IF EXISTS "Customers can delete their own pending, rejected, payment_pending, or checkout_created requests" ON public.commission_requests;

CREATE POLICY "Customers can delete their own pending or rejected requests" 
ON public.commission_requests 
FOR DELETE 
USING (
  customer_id = auth.uid() 
  AND status IN ('pending', 'rejected')
);
