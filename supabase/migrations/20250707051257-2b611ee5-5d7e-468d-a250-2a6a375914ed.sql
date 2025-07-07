-- Update the existing incomplete subscription to active status
UPDATE user_subscriptions 
SET status = 'active', updated_at = now()
WHERE stripe_subscription_id = 'sub_1Ri6zNCli7UywJenViS0AYAA' 
AND status = 'incomplete';