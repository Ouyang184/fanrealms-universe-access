
-- Update commission requests with old payment_pending status to pending
-- so they can be properly accepted or rejected in the new UI
UPDATE commission_requests 
SET status = 'pending' 
WHERE status = 'payment_pending';

-- Also update any other old statuses that should be pending
UPDATE commission_requests 
SET status = 'pending' 
WHERE status IN ('checkout_created', 'payment_authorized', 'payment_failed') 
AND stripe_payment_intent_id IS NULL;
