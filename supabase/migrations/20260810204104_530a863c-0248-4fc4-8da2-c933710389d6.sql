
ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS scan_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS scan_verdict jsonb,
  ADD COLUMN IF NOT EXISTS scan_hash text,
  ADD COLUMN IF NOT EXISTS scanned_at timestamptz;

ALTER TABLE public.product_versions
  ADD COLUMN IF NOT EXISTS scan_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS scan_verdict jsonb,
  ADD COLUMN IF NOT EXISTS scan_hash text,
  ADD COLUMN IF NOT EXISTS scanned_at timestamptz;

-- products/versions with no file at all are not scannable
UPDATE public.digital_products
   SET scan_status = 'clean'
 WHERE asset_file_path IS NULL;

-- validation triggers instead of check constraints (project convention)
CREATE OR REPLACE FUNCTION public.validate_scan_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.scan_status NOT IN ('pending','clean','infected','error','unscannable') THEN
    RAISE EXCEPTION 'invalid scan_status: %', NEW.scan_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_scan_status_digital_products ON public.digital_products;
CREATE TRIGGER validate_scan_status_digital_products
  BEFORE INSERT OR UPDATE ON public.digital_products
  FOR EACH ROW EXECUTE FUNCTION public.validate_scan_status();

DROP TRIGGER IF EXISTS validate_scan_status_product_versions ON public.product_versions;
CREATE TRIGGER validate_scan_status_product_versions
  BEFORE INSERT OR UPDATE ON public.product_versions
  FOR EACH ROW EXECUTE FUNCTION public.validate_scan_status();

-- read grants follow the existing column-grant model
GRANT SELECT (scan_status, scanned_at) ON public.digital_products TO anon, authenticated;
GRANT SELECT (scan_status, scanned_at) ON public.product_versions TO anon, authenticated;
GRANT ALL ON public.digital_products TO service_role;
GRANT ALL ON public.product_versions TO service_role;
