-- Create email_2fa_codes table for storing temporary verification codes
CREATE TABLE public.email_2fa_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.email_2fa_codes ENABLE ROW LEVEL SECURITY;

-- Create policies - users can only access their own codes
CREATE POLICY "Users can view their own 2FA codes" 
ON public.email_2fa_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA codes" 
ON public.email_2fa_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA codes" 
ON public.email_2fa_codes 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_email_2fa_codes_user_id ON public.email_2fa_codes(user_id);
CREATE INDEX idx_email_2fa_codes_expires_at ON public.email_2fa_codes(expires_at);

-- Add email_2fa_enabled field to users table
ALTER TABLE public.users 
ADD COLUMN email_2fa_enabled BOOLEAN NOT NULL DEFAULT false;

-- Function to cleanup expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_2fa_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.email_2fa_codes 
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$;