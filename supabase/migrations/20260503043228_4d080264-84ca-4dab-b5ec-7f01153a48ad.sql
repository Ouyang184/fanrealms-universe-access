-- Tighten post-attachments storage SELECT policy to enforce per-post tier gating
-- Previously: any active subscriber of the creator could read all attachments
-- Now: subscriber must hold the specific tier(s) required for the post that references the file

CREATE OR REPLACE FUNCTION public.user_can_access_post_attachment(object_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  folder_creator text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  folder_creator := (storage.foldername(object_name))[1];

  -- Owner of the folder (the creator/author) always has access
  IF folder_creator = auth.uid()::text THEN
    RETURN true;
  END IF;

  -- Otherwise, the file must be referenced by a post the user can access
  RETURN EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE (p.author_id::text = folder_creator OR p.creator_id::text = folder_creator)
      AND p.attachments::text LIKE '%' || object_name || '%'
      AND (
        -- Public post (no tier gate and no per-post tier rows)
        (
          p.tier_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM public.post_tiers pt WHERE pt.post_id = p.id)
        )
        -- Single tier on the post
        OR (p.tier_id IS NOT NULL AND public.user_has_tier_access(p.tier_id))
        -- Multi-tier mapping via post_tiers
        OR EXISTS (
          SELECT 1 FROM public.post_tiers pt
          WHERE pt.post_id = p.id
            AND public.user_has_tier_access(pt.tier_id)
        )
      )
  );
END;
$$;

DROP POLICY IF EXISTS "post_attachments_access" ON storage.objects;

CREATE POLICY "post_attachments_access"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'post-attachments'
  AND public.user_can_access_post_attachment(name)
);