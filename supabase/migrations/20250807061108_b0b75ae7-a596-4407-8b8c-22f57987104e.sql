-- Drop the problematic trigger temporarily to test
DROP TRIGGER IF EXISTS trigger_update_tag_usage_commission_types ON public.commission_types;