-- Fix security warnings by setting search_path for the functions
-- Update the prevent duplicate function
CREATE OR REPLACE FUNCTION public.prevent_duplicate_commission_requests()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Update the logging function
CREATE OR REPLACE FUNCTION public.log_commission_request_creation()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log commission request creation for monitoring
  RAISE LOG 'Commission request created: ID=%, Customer=%, Type=%, Status=%', 
    NEW.id, NEW.customer_id, NEW.commission_type_id, NEW.status;
  
  RETURN NEW;
END;
$$;