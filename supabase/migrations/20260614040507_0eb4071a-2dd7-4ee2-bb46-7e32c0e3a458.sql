-- Previous column-level REVOKE on product_versions.file_path was masked by the
-- table-level SELECT grant. Re-do it correctly: revoke table-level SELECT, then
-- grant SELECT only on the non-sensitive columns.

REVOKE SELECT ON public.product_versions FROM anon, authenticated;

GRANT SELECT (id, product_id, version_number, release_notes, created_at)
  ON public.product_versions TO anon, authenticated;

-- service_role keeps full table access (already granted); no change needed there.