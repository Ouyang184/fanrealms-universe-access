
-- Add age verification columns to the users table
ALTER TABLE public.users 
ADD COLUMN age_verified boolean DEFAULT false,
ADD COLUMN date_of_birth date;

-- Update existing users to have age_verified as false by default
UPDATE public.users SET age_verified = false WHERE age_verified IS NULL;
