## Goal
Close the 6 security findings without breaking creator workflows. The frontend already uses safe column lists and SECURITY DEFINER RPCs for sensitive data — the DB grants just haven't been tightened to match. This plan only tightens grants and one storage policy.

## What I verified
- `useCreatorEarnings` already updates `platform_fee_rate` via UPDATE (not SELECT) and reads it via `get_creator_fee_rate` RPC.
- `useMarketplace` already selects an explicit safe column list and uses `get_creator_product` RPC to fetch `asset_url` / `asset_file_path` for the owner.
- `useJobs` already excludes `contact_info` from public SELECTs and uses `get_my_job_listing_contact` RPC for the poster.
- `useProductVersions` already selects `id, product_id, version_number, release_notes, created_at` only (no `file_path`); the publish mutation returns `file_path` from the locally constructed value.
- Membership tier Stripe IDs are only needed in edge functions (which use `service_role` and are unaffected by these revokes).

## Migration

One migration that does all of the following:

1. **creators**: `REVOKE SELECT (platform_fee_rate) ON public.creators FROM anon, authenticated;`
2. **digital_products**: `REVOKE SELECT (asset_file_path, asset_url, stripe_price_id) ON public.digital_products FROM anon, authenticated;`
3. **job_listings**: `REVOKE SELECT (contact_info) ON public.job_listings FROM anon, authenticated;`
4. **membership_tiers**: `REVOKE SELECT (stripe_price_id, stripe_product_id) ON public.membership_tiers FROM anon, authenticated;`
5. **product_versions**: `REVOKE SELECT (file_path) ON public.product_versions FROM anon, authenticated;` (creators still write it; the `usePublishProductVersion` mutation returns the locally generated path, not a SELECT.)
6. **storage.objects "product-images public read"**: replace the broad bucket-wide SELECT policy with an owner-scoped one — `bucket_id='product-images' AND auth.uid()::text = (storage.foldername(name))[1]`. Public reads still work because the bucket is `public: true` and uses the CDN public URL, which bypasses RLS. The owner-scoped SELECT preserves the `upsert: true` pre-check for cover/banner/screenshot uploads. This closes the "Public Bucket Allows Listing" warning.

`service_role` keeps full access throughout (edge functions, Stripe webhooks, admin code untouched).

## Why creators can still do everything
- Uploading covers / files: INSERT/UPDATE policies are owner-scoped on `auth.uid()` — unchanged.
- Editing their own product (including `asset_file_path`, `asset_url`, `stripe_price_id`): UPDATE is unaffected by column SELECT revokes; the dashboard reads the owner's full product row via `get_creator_product` RPC (SECURITY DEFINER).
- Reading their own `platform_fee_rate`: continues via `get_creator_fee_rate` RPC.
- Reading their own job listing `contact_info`: continues via `get_my_job_listing_contact` RPC.
- Publishing new product versions: insert returns the locally constructed `file_path`; no SELECT on the column is needed.
- Buyers downloading paid files: continues via the `get-download-url` edge function (service_role).

## Out of scope
No frontend code changes needed. If anything fails after the revoke, the fix is a targeted RPC, not undoing the grant change.
