-- Update the default notification_preferences to remove creator_updates
ALTER TABLE public.users 
ALTER COLUMN notification_preferences 
SET DEFAULT jsonb_build_object(
  'email_notifications', true, 
  'new_content_alerts', true, 
  'comment_replies', true
);

-- Update existing users to remove creator_updates from their notification preferences
UPDATE public.users 
SET notification_preferences = notification_preferences - 'creator_updates'
WHERE notification_preferences ? 'creator_updates';