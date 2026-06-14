## Plan: Crop-on-upload for product covers

Force every cover image to a fixed 16:9 aspect ratio at upload time so it always fills the rectangle with no crop or letterboxing.

### Add a cropper UI

Add `react-easy-crop` (small, popular, no peer-dep issues) and create `src/components/dashboard/ImageCropperDialog.tsx`:
- Modal that opens when a creator picks a cover file.
- Locked 16:9 aspect, drag to reposition, scroll/slider to zoom.
- "Cancel" / "Use this crop" buttons.
- On confirm: produces a cropped JPEG `File` via canvas and hands it back.

### Wire into the two existing upload paths

Use the cropper instead of uploading the raw file in:
- `src/components/dashboard/AssetFormDialog.tsx`
- `src/pages/DashboardAssetDetail.tsx` (the `uploadCover` path only — banner/screenshots untouched)

Flow becomes: pick file → cropper opens → confirm → preview + queued upload uses the cropped file.

### Switch marketplace display back to filling the rectangle

Since stored covers are now guaranteed 16:9, swap the foreground `<img>` from `object-contain` to `object-cover` and drop the blurred backdrop layer in:
- `src/components/marketplace/FeaturedSpotlight.tsx` (16:9 container — perfect match)
- `src/components/marketplace/ProductGridDense.tsx` (4:3 container — minor edge crop on a 16:9 image, acceptable and uniform)

### Existing covers

Old covers stay as-is — they were uploaded freely and may not be 16:9. They'll be `object-cover`'d like everything else (minor crop). Creators can re-upload to recrop. No migration needed.

### Out of scope

- Banner, screenshots, avatars, project/jam covers.
- No DB/storage/RLS changes.
- No edge function changes.