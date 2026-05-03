## Goal

Only show users on "Featured Creators" / public creator listings if they have actually set up a creator presence — meaning they have at least one **project** or one **digital product (asset)**. Users who only opted in via "Become a Creator" but never uploaded anything should be hidden.

## Approach

The public creator list is powered by a single Postgres RPC, `get_public_creators_list`, used by:
- `src/hooks/useCreators.ts`
- `src/hooks/usePopularCreators.ts`
- `src/hooks/useCreatorFetch.ts`
- `src/utils/creatorLookupStrategies.ts`
- `src/components/home/FeaturedCreators.tsx`, `src/components/explore/FeaturedCreators.tsx`, `src/components/marketplace/FeaturedSpotlight.tsx` (via the hooks above)

Filtering at the RPC level fixes every surface in one shot — no component changes needed.

## Database migration

Update `public.get_public_creators_list` to add an `EXISTS` filter requiring the creator to own at least one project or one digital product:

```sql
WHERE (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.creator_id = c.id)
  OR EXISTS (SELECT 1 FROM public.digital_products d WHERE d.creator_id = c.id)
)
AND (p_search IS NULL OR ...)
```

Same signature, same return columns — no client/type changes required.

## Out of scope

- The single-creator profile page (`/creator/:username`) is not affected; users visiting a direct profile URL will still see it.
- "Become a Creator" flow is unchanged — users can still opt in; they just won't appear in featured listings until they publish a project or asset.

## Verification

After the migration, reload `/marketplace` and the home page — users with no projects/assets should disappear from Featured/Popular Creators lists.