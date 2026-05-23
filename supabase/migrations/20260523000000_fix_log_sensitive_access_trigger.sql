-- Fix broken log_sensitive_access trigger on creators table.
-- The function was referencing NEW.stripe_account_id which does not exist
-- on the creators table (it lives on creator_stripe_accounts instead).
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_TABLE_NAME = 'creators' AND (
    NEW.commission_base_rate IS DISTINCT FROM OLD.commission_base_rate
  ) THEN
    PERFORM public.log_payment_access(
      'creators_financial',
      'SENSITIVE_UPDATE',
      jsonb_build_object(
        'creator_id', NEW.id,
        'changed_fields', jsonb_build_object(
          'commission_rate_changed', (NEW.commission_base_rate IS DISTINCT FROM OLD.commission_base_rate)
        )
      )
    );
  END IF;

  RETURN NEW;
END;
$$;
