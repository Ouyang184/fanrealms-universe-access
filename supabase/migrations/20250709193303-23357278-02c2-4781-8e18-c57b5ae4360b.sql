-- Update existing commission requests that have checkout session IDs (indicating payment was initiated)
-- but are still in pending status to accepted status for completed payments

-- First, let's update the status constraint to include the new payment_pending status
ALTER TABLE public.commission_requests 
DROP CONSTRAINT IF EXISTS commission_requests_status_check;

ALTER TABLE public.commission_requests 
ADD CONSTRAINT commission_requests_status_check 
CHECK (status IN ('pending', 'payment_pending', 'payment_authorized', 'payment_failed', 'accepted', 'rejected', 'in_progress', 'completed', 'delivered', 'under_review', 'revision_requested', 'cancelled', 'refunded'));

-- Update existing commissions that have checkout session IDs starting with 'cs_' 
-- (indicating Stripe checkout sessions) to accepted status
-- This handles the commissions that were paid but webhooks didn't update the status
UPDATE public.commission_requests 
SET 
  status = 'accepted',
  creator_notes = 'Payment completed - status updated retroactively'
WHERE 
  status = 'pending' 
  AND stripe_payment_intent_id IS NOT NULL 
  AND stripe_payment_intent_id LIKE 'cs_%';

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % commission requests from pending to accepted', updated_count;
END $$;