-- Fix the commission payment status flow
-- First, revert the overly aggressive status updates from the previous migration

-- Update commissions that were incorrectly set to 'accepted' back to appropriate status
-- If they have a Stripe checkout session ID but no payment intent, they should be 'pending'
-- If they have a payment intent ID, they should be 'payment_pending' (awaiting creator action)

UPDATE public.commission_requests 
SET 
  status = CASE
    -- If has checkout session but no payment intent, customer didn't complete payment
    WHEN stripe_payment_intent_id LIKE 'cs_%' THEN 'pending'
    -- If has payment intent (pi_), payment was completed, awaiting creator acceptance
    WHEN stripe_payment_intent_id LIKE 'pi_%' THEN 'payment_pending'  
    -- Otherwise keep current status
    ELSE status
  END,
  creator_notes = CASE
    WHEN stripe_payment_intent_id LIKE 'cs_%' THEN 'Checkout initiated but payment not completed'
    WHEN stripe_payment_intent_id LIKE 'pi_%' THEN 'Payment completed - awaiting creator acceptance'
    ELSE creator_notes
  END
WHERE 
  status = 'accepted' 
  AND creator_notes = 'Payment completed - status updated retroactively';

-- Also ensure any truly pending commissions (no payment info) stay pending
UPDATE public.commission_requests 
SET status = 'pending'
WHERE status = 'accepted' 
  AND stripe_payment_intent_id IS NULL;