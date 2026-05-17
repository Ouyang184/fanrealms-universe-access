-- Add contact_info field to job_listings so posters can share
-- how applicants should reach them (Discord, email, Twitter, etc.)
ALTER TABLE public.job_listings
  ADD COLUMN IF NOT EXISTS contact_info text;
