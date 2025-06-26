
-- Add missing indexes on foreign keys for better query performance
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON public.post_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_post_tiers_tier_id ON public.post_tiers(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier_id ON public.user_subscriptions(tier_id);

-- Remove unused indexes to improve write performance and reduce storage
DROP INDEX IF EXISTS idx_post_shares_platform;
DROP INDEX IF EXISTS idx_creators_nsfw;
DROP INDEX IF EXISTS idx_posts_nsfw;
DROP INDEX IF EXISTS idx_post_views_user_id;
DROP INDEX IF EXISTS idx_conversation_participants_conversation_id;
DROP INDEX IF EXISTS idx_subscriptions_tier_id;
DROP INDEX IF EXISTS idx_creator_earnings_subscription_id;
DROP INDEX IF EXISTS idx_follows_creator_id;
DROP INDEX IF EXISTS idx_membership_tiers_creator_id;
DROP INDEX IF EXISTS idx_messages_receiver_id;
DROP INDEX IF EXISTS idx_posts_tier_id;
DROP INDEX IF EXISTS idx_membership_tiers_stripe_product_id;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_conversation_participants_other_user_id;
DROP INDEX IF EXISTS idx_feeds_user_id;
DROP INDEX IF EXISTS idx_posts_creator_id;
DROP INDEX IF EXISTS idx_post_reads_user_id;
