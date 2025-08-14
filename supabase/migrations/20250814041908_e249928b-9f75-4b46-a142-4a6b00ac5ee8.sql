-- Fix security warning: Set search_path for function
ALTER FUNCTION prevent_duplicate_commission_requests() SET search_path = '';