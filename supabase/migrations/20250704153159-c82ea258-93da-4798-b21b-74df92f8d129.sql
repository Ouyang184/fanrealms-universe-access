
-- Update the commission_requests status constraint to include all payment-related statuses
ALTER TABLE public.commission_requests 
DROP CONSTRAINT IF EXISTS commission_requests_status_check;

ALTER TABLE public.commission_requests 
ADD CONSTRAINT commission_requests_status_check 
CHECK (status IN (
  'pending', 
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
