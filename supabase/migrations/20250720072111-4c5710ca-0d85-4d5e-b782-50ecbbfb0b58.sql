-- Update the handle_new_user_simple function to generate better default usernames
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  default_username TEXT;
  adjectives TEXT[] := ARRAY['Amazing', 'Brilliant', 'Creative', 'Dynamic', 'Energetic', 'Fantastic', 'Graceful', 'Happy', 'Incredible', 'Joyful'];
  nouns TEXT[] := ARRAY['Artist', 'Creator', 'Builder', 'Designer', 'Explorer', 'Finder', 'Guardian', 'Helper', 'Innovator', 'Joker'];
  random_number INTEGER;
BEGIN
  -- Generate a random username if none provided
  IF NEW.raw_user_meta_data->>'username' IS NULL OR NEW.raw_user_meta_data->>'username' = '' THEN
    -- Create random username: AdjectiveNoun + random number
    random_number := floor(random() * 1000)::INTEGER;
    default_username := adjectives[1 + floor(random() * array_length(adjectives, 1))::INTEGER] || 
                       nouns[1 + floor(random() * array_length(nouns, 1))::INTEGER] || 
                       random_number::TEXT;
  ELSE
    default_username := NEW.raw_user_meta_data->>'username';
  END IF;
  
  -- If email prefix looks reasonable, prefer it over random name
  IF default_username IS NULL OR default_username = '' THEN
    IF NEW.email IS NOT NULL THEN
      default_username := LEFT(NEW.email, POSITION('@' IN NEW.email) - 1);
      -- If email prefix is just numbers or very short, use random name instead
      IF LENGTH(default_username) <= 3 OR default_username ~ '^[0-9]+$' THEN
        random_number := floor(random() * 1000)::INTEGER;
        default_username := adjectives[1 + floor(random() * array_length(adjectives, 1))::INTEGER] || 
                           nouns[1 + floor(random() * array_length(nouns, 1))::INTEGER] || 
                           random_number::TEXT;
      END IF;
    END IF;
  END IF;
  
  -- Extremely simple insert with minimal processing
  INSERT INTO public.users (id, email, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    default_username,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let this trigger fail and block signup
  RETURN NEW;
END;
$function$;