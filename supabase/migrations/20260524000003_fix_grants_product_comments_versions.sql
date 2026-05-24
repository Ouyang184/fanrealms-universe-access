-- Tighten grants on product_comments and product_versions.
-- Lovable's migration runner granted all privileges to anon/authenticated by default.
-- RLS policies already block unauthorized writes, but revoke the grants too for defence-in-depth.

-- product_comments: anon = SELECT only; authenticated = SELECT + INSERT + UPDATE
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.product_comments FROM anon;
REVOKE TRUNCATE, DELETE ON public.product_comments FROM authenticated;

-- product_versions: anon = SELECT only; authenticated = SELECT + INSERT + UPDATE + DELETE
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.product_versions FROM anon;
REVOKE TRUNCATE ON public.product_versions FROM authenticated;
