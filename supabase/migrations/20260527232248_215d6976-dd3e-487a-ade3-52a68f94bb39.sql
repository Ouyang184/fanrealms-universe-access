-- Restrict product_versions.file_path so it is not readable by clients via PostgREST.
-- Edge functions (service_role) can still read it for verified buyers/owners.
REVOKE SELECT (file_path) ON public.product_versions FROM anon, authenticated;
-- Re-grant column-level SELECT for all other columns explicitly (PostgREST requires column-level grants once any column is restricted)
GRANT SELECT (id, product_id, version_number, release_notes, created_at) ON public.product_versions TO anon, authenticated;