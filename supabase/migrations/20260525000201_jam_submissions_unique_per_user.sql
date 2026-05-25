-- Prevent a user from submitting more than once per jam.
-- Without this a fast double-click on "Submit entry" could create duplicates.
ALTER TABLE public.jam_submissions
  ADD CONSTRAINT jam_submissions_jam_user_unique UNIQUE (jam_id, user_id);
