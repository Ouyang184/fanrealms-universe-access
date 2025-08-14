-- Phase 1: Clean up duplicate commission requests
-- Keep only the most recent "oj" commission request (57d792af-e6d1-4565-8486-e6e4dd41a1f6)
-- Delete the 4 older duplicates

DELETE FROM public.commission_requests 
WHERE title = 'oj' 
AND id NOT IN ('57d792af-e6d1-4565-8486-e6e4dd41a1f6');

-- Phase 2: Prevention measures
-- Add a function to prevent rapid duplicate commission requests
CREATE OR REPLACE FUNCTION public.prevent_duplicate_commission_requests()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's already a pending commission request from the same customer
  -- for the same commission type within the last 5 minutes
  IF EXISTS (
    SELECT 1 FROM public.commission_requests cr
    WHERE cr.customer_id = NEW.customer_id
    AND cr.commission_type_id = NEW.commission_type_id
    AND cr.status IN ('pending', 'payment_pending', 'payment_authorized')
    AND cr.created_at > NOW() - INTERVAL '5 minutes'
    AND cr.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'A similar commission request was recently submitted. Please wait before submitting another request.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent duplicates
DROP TRIGGER IF EXISTS prevent_duplicate_commissions ON public.commission_requests;
CREATE TRIGGER prevent_duplicate_commissions
  BEFORE INSERT ON public.commission_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_commission_requests();

-- Add logging function for commission request tracking
CREATE OR REPLACE FUNCTION public.log_commission_request_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Log commission request creation for monitoring
  RAISE LOG 'Commission request created: ID=%, Customer=%, Type=%, Status=%', 
    NEW.id, NEW.customer_id, NEW.commission_type_id, NEW.status;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for logging
DROP TRIGGER IF EXISTS log_commission_creation ON public.commission_requests;
CREATE TRIGGER log_commission_creation
  AFTER INSERT ON public.commission_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_commission_request_creation();