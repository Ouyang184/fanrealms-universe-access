-- Revoke anon ability to read contact_info from job_listings (protects email/phone of posters)
REVOKE SELECT (contact_info) ON public.job_listings FROM anon;
-- Authenticated users keep access (default grant covers all columns)