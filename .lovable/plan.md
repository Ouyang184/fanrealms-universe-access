## Plan

Add a blurred backdrop fill behind product cover images so the rectangle is always filled, without cropping the actual image.

### Files to update
- `src/components/marketplace/FeaturedSpotlight.tsx`
- `src/components/marketplace/ProductGridDense.tsx`

### Change
In each image container:
- Add a second `<img>` of the same `cover_image_url` positioned absolutely, filling the box with `object-cover`, `blur-xl`, `scale-110`, and reduced opacity (~50%). Mark it `aria-hidden`.
- Keep the existing foreground `<img>` on top with `object-contain` so the full asset is visible.
- Both layered inside the existing `aspect-[16/9]` / `aspect-[4/3]` container with `relative overflow-hidden`.

### Out of scope
- No changes to uploads, storage, DB, or any other component.
- No new dependencies.