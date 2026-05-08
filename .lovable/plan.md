## Devlog draft vs published

The `devlogs` table already has a `status` column (`'draft' | 'published'`), the editor already lets creators choose between them, and RLS already restricts public reads to `status = 'published'` on published projects. The remaining gap is the public-facing query in `useProjectDevlogs`, which currently fetches all statuses (creators viewing their own project would see drafts mixed in with published).

### Changes

1. **`src/hooks/useProjects.ts` — `useProjectDevlogs`**
   - Add `.eq('status', 'published')` to the query so the public project page only ever shows published devlogs, regardless of viewer.

2. **`src/pages/DashboardDevlogEdit.tsx`**
   - Default `status` to `'draft'` for new devlogs (currently defaults to `'published'`) so creators publish intentionally.
   - Add two save actions: "Save draft" (status=draft) and "Publish" (status=published) instead of a single Save + status dropdown, matching itch.io's pattern. Keep the status select for editing existing devlogs so a creator can unpublish.

3. **`src/pages/DashboardDevlogs.tsx`**
   - Already shows a LIVE/DRAFT badge — no change needed.
   - Optional: add a quick "Publish" / "Unpublish" toggle button per row (uses the existing `useSaveDevlog` mutation).

### Out of scope

- No DB migration (schema already correct).
- No changes to RLS (already correct).
- No scheduling / `publish_at` field.
