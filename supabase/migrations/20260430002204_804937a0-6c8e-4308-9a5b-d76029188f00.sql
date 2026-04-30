
-- Auto-create a public.users profile row whenever a new auth user appears
-- (covers email/password, Google, Discord, and any future OAuth providers).

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base       text;
  v_candidate  text;
  v_attempt    int := 0;
  v_full_name  text;
  v_avatar     text;
BEGIN
  -- Skip if a profile already exists (e.g. signup hook already inserted it)
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Pull display name / avatar from OAuth metadata when available
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NULL
  );
  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  -- Build a base username from email local-part, sanitized
  v_base := lower(regexp_replace(split_part(COALESCE(NEW.email, 'user'), '@', 1), '[^a-z0-9_]', '', 'g'));
  IF v_base IS NULL OR length(v_base) < 3 THEN
    v_base := 'user';
  END IF;
  v_base := substring(v_base from 1 for 20);

  -- Try base, then base + 6-char id suffix, then base + random suffix loop
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
  -- Never block auth signup on profile-row creation issues
  RAISE WARNING 'handle_new_auth_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
