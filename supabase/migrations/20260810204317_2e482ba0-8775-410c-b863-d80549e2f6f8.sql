
CREATE OR REPLACE FUNCTION public.reset_scan_on_file_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.asset_file_path IS DISTINCT FROM OLD.asset_file_path THEN
    IF NEW.asset_file_path IS NULL THEN
      NEW.scan_status := 'clean';
    ELSE
      NEW.scan_status := 'pending';
    END IF;
    NEW.scan_verdict := NULL;
    NEW.scan_hash := NULL;
    NEW.scanned_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reset_scan_on_file_change_digital_products ON public.digital_products;
CREATE TRIGGER reset_scan_on_file_change_digital_products
  BEFORE UPDATE ON public.digital_products
  FOR EACH ROW EXECUTE FUNCTION public.reset_scan_on_file_change();
