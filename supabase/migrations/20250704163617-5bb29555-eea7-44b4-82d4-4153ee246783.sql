
-- Update the commission_requests status check constraint to include checkout_created
ALTER TABLE commission_requests 
DROP CONSTRAINT IF EXISTS commission_requests_status_check;

ALTER TABLE commission_requests 
ADD CONSTRAINT commission_requests_status_check 
CHECK (status IN (
  'pending',
  'checkout_created', 
  'payment_pending',
  'payment_authorized',
  'payment_failed',
  'accepted',
  'rejected',
  'in_progress',
  'completed',
  'delivered',
  'under_review',
  'revision_requested',
  'cancelled',
  'refunded'
));
