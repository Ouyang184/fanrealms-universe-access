
-- 1. Remove orphan public.users rows (no matching auth.users)
DELETE FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Add ON DELETE CASCADE FK so future deletes from auth.users clean up automatically
ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey FOREIGN KEY (id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Error log table (service role only)
CREATE TABLE IF NOT EXISTS public.auth_trigger_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  sqlstate text,
  sqlerrm text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.auth_trigger_errors ENABLE ROW LEVEL SECURITY;
-- No policies => only service role can access

-- 4. Rewrite handle_new_auth_user to reclaim email collisions and log unexpected errors
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_base       text;
  v_candidate  text;
  v_attempt    int := 0;
  v_full_name  text;
  v_avatar     text;
  v_existing   uuid;
BEGIN
  -- Skip if a profile already exists for this id
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NULL);
  v_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL);

  -- Reclaim orphan profile by email if one exists (shouldn't after cleanup + FK, but defensive)
  IF NEW.email IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.users WHERE email = NEW.email LIMIT 1;
    IF v_existing IS NOT NULL THEN
      -- If it's already a different valid auth user, leave it alone and return
      IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_existing) THEN
        RETURN NEW;
      END IF;
      -- Otherwise reclaim by updating the row's id to the new auth user
      UPDATE public.users
        SET id = NEW.id,
            profile_picture = COALESCE(profile_picture, v_avatar),
            updated_at = now()
        WHERE id = v_existing;
      RETURN NEW;
    END IF;
  END IF;

  -- Build username
  v_base := lower(regexp_replace(split_part(COALESCE(NEW.email, 'user'), '@', 1), '[^a-z0-9_]', '', 'g'));
  IF v_base IS NULL OR length(v_base) < 3 THEN
    v_base := 'user';
  END IF;
  v_base := substring(v_base from 1 for 20);

  v_candidate := v_base;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = v_candidate) AND v_attempt < 5 LOOP
    v_attempt := v_attempt + 1;
    IF v_attempt = 1 THEN
      v_candidate := v_base || '_' || substring(replace(NEW.id::text, '-', '') from 1 for 6);
    ELSE
      v_candidate := v_base || '_' || substring(md5(random()::text || clock_timestamp()::text) from 1 for 6);
    END IF;
  END LOOP;

  INSERT INTO public.users (id, email, username, profile_picture)
  VALUES (NEW.id, COALESCE(NEW.email, ''), v_candidate, v_avatar);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO public.auth_trigger_errors (user_id, email, sqlstate, sqlerrm)
    VALUES (NEW.id, NEW.email, SQLSTATE, SQLERRM);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RAISE WARNING 'handle_new_auth_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;
