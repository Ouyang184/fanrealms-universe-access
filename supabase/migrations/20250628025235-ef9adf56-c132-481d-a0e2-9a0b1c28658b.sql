
-- Add INSERT policy for users table to allow authenticated users to create their own records
CREATE POLICY "Users can insert their own record" 
ON public.users 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Update the trigger function to use SECURITY DEFINER for elevated privileges
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Extremely simple insert with minimal processing
  INSERT INTO public.users (id, email, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', LEFT(NEW.email, POSITION('@' IN NEW.email) - 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let this trigger fail and block signup
  RETURN NEW;
END;
$$;
