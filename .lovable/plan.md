## Plan

1. Update the marketplace display components only:
   - `FeaturedSpotlight.tsx`
   - `ProductGridDense.tsx`

2. Change product cover images from cropped display to full-image display:
   - Replace `object-cover` with `object-contain` so the entire uploaded image is visible.
   - Keep the existing fixed aspect-ratio containers so the marketplace layout does not jump or break.
   - Use the existing muted background behind images, so wider/taller images may show empty space instead of being cut off.

3. Leave creator upload logic untouched:
   - No changes to storage buckets, upload paths, database fields, or Supabase policies.
   - Uploaded cover images will continue saving exactly as they do now; only the way they are rendered in marketplace cards/featured area changes.

4. Verify the marketplace preview visually after the edit to confirm the full image is shown without cropping.