-- Add notification preference columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT jsonb_build_object(
  'email_notifications', true,
  'new_content_alerts', true,
  'comment_replies', true,
  'mentions', true,
  'creator_updates', true
);

-- Update existing users to have default notification preferences
UPDATE public.users 
SET notification_preferences = jsonb_build_object(
  'email_notifications', true,
  'new_content_alerts', true,
  'comment_replies', true,
  'mentions', true,
  'creator_updates', true
)
WHERE notification_preferences IS NULL;