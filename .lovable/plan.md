## Devlog delete: confirmation modal + error toast

Replace the native `confirm()` call in `src/pages/DashboardDevlogs.tsx` with a shadcn `AlertDialog`, and add an `onError` toast to the existing `useDeleteDevlog` mutation.

### Changes

1. **`src/hooks/useDevlogs.ts`**
   - Add `onError: (e: Error) => toast.error('Failed to delete: ' + e.message)` to `useDeleteDevlog` (currently only has `onSuccess`).

2. **`src/pages/DashboardDevlogs.tsx`**
   - Import `AlertDialog` primitives from `@/components/ui/alert-dialog`.
   - Track `deletingId` in local state.
   - Replace the inline `confirm(...)` trash-icon handler with one that opens the dialog.
   - Render a single `AlertDialog` controlled by `deletingId` with title "Delete devlog?", description warning that it's permanent, Cancel + Delete actions. Delete button calls `del.mutate(deletingId)` and closes the dialog.

### Out of scope
- No DB or RLS changes.
- No bulk delete.
