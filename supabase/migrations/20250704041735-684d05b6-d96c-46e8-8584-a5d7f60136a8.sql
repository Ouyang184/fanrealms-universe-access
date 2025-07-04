
-- Add stripe_payment_intent_id field to commission_requests table
ALTER TABLE public.commission_requests 
ADD COLUMN stripe_payment_intent_id TEXT;

-- Create index for better performance when looking up by payment intent ID
CREATE INDEX idx_commission_requests_stripe_payment_intent_id 
ON public.commission_requests(stripe_payment_intent_id);
