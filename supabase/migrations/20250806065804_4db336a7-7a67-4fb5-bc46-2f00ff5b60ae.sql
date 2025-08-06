-- Update the default notification_preferences to remove mentions
ALTER TABLE public.users 
ALTER COLUMN notification_preferences 
SET DEFAULT jsonb_build_object(
  'email_notifications', true, 
  'new_content_alerts', true, 
  'comment_replies', true, 
  'creator_updates', true
);

-- Update existing users to remove mentions from their notification preferences
UPDATE public.users 
SET notification_preferences = notification_preferences - 'mentions'
WHERE notification_preferences ? 'mentions';