-- Enhanced duplicate prevention for commission requests
-- This trigger prevents users from creating multiple pending/incomplete requests for the same commission type

CREATE OR REPLACE FUNCTION prevent_duplicate_commission_requests()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has a pending, payment_pending, payment_failed, or accepted request for this commission type
  IF EXISTS (
    SELECT 1 
    FROM commission_requests 
    WHERE customer_id = NEW.customer_id 
      AND commission_type_id = NEW.commission_type_id 
      AND creator_id = NEW.creator_id
      AND status IN ('pending', 'payment_pending', 'payment_failed', 'accepted')
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'You already have an active request for this commission type. Please complete or cancel the existing request first.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;