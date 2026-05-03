-- Add display_name to public.users (nullable). Username already exists.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_name text;

-- Case-insensitive uniqueness on username (only when set)
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique
  ON public.users (lower(username))
  WHERE username IS NOT NULL;

-- Backfill from creators so existing creators stay "complete"
UPDATE public.users u
SET
  username = COALESCE(u.username, c.username),
  display_name = COALESCE(u.display_name, c.display_name)
FROM public.creators c
WHERE c.user_id = u.id
  AND (u.username IS NULL OR u.display_name IS NULL);