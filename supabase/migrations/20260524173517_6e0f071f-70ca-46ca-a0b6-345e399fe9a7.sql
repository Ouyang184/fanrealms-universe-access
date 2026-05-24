-- Hide contact_info from anonymous visitors on public job listings.
-- Authenticated users (potential applicants) still see contact_info.
REVOKE SELECT (contact_info) ON public.job_listings FROM anon;