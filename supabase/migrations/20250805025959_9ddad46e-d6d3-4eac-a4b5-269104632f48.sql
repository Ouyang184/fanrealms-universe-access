-- Drop existing email_2fa_codes table and recreate with email as primary key
DROP TABLE IF EXISTS public.email_2fa_codes;

-- Create new email_2fa_codes table with email as primary key
CREATE TABLE public.email_2fa_codes (
  email text PRIMARY KEY,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_2fa_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can only access rows where email matches their auth email
CREATE POLICY "Users can view their own 2FA codes" 
ON public.email_2fa_codes 
FOR SELECT 
USING (auth.email() = email);

CREATE POLICY "Users can insert their own 2FA codes" 
ON public.email_2fa_codes 
FOR INSERT 
WITH CHECK (auth.email() = email);

CREATE POLICY "Users can update their own 2FA codes" 
ON public.email_2fa_codes 
FOR UPDATE 
USING (auth.email() = email);

CREATE POLICY "Users can delete their own 2FA codes" 
ON public.email_2fa_codes 
FOR DELETE 
USING (auth.email() = email);