
-- Add unique constraint to prevent duplicate active subscriptions to the same creator/tier
-- This ensures a user can only have one active subscription per creator at a time
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_user_creator_subscription 
ON public.user_subscriptions (user_id, creator_id) 
WHERE status = 'active';

-- Also add constraint to prevent multiple subscriptions to the exact same tier
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_user_tier_subscription 
ON public.user_subscriptions (user_id, tier_id) 
WHERE status = 'active';

-- Clean up any existing duplicate subscriptions (keep the most recent one)
WITH ranked_subscriptions AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY user_id, creator_id, tier_id 
           ORDER BY created_at DESC
         ) as rn
  FROM public.user_subscriptions 
  WHERE status = 'active'
)
DELETE FROM public.user_subscriptions 
WHERE id IN (
  SELECT id FROM ranked_subscriptions WHERE rn > 1
);
