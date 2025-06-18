
-- Reset age verification status for testing
UPDATE public.users 
SET age_verified = false 
WHERE id = auth.uid();
