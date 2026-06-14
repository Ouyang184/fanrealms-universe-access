## Polish + verification

### 1. Swap `alert()` for sonner toast
In `src/components/jobs/JobApplicationDialog.tsx`:
- Import `toast` from `sonner`.
- Replace `alert('Portfolio URL must start with http:// or https://')` with `toast.error('Portfolio URL must start with http:// or https://')`.
- Keep the early `return` so the dialog stays open on invalid input and the user can correct the URL.

Behavior unchanged: empty portfolio still submits, valid http(s) URLs still submit, only invalid schemes are blocked — now with a non-blocking toast that matches the rest of the app.

### 2. Verify nothing else broke
- Re-read `JobApplicantsList.tsx` and `JobApplicationDialog.tsx` to confirm the edits are clean.
- Grep for any other consumers of `portfolio_url` to make sure the render change is consistent.
- Confirm the marketplace asset upload path (`AssetFormDialog.tsx`, `useSampleImageUpload`, `create-stripe-product` edge function) was not touched by the security fix.
- Load `/marketplace` and a job detail page in the preview to confirm both still render and the apply dialog opens.

No database, RLS, or edge-function changes.
