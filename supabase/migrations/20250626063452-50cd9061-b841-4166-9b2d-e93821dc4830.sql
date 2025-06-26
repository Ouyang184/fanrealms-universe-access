
-- Re-add essential indexes for foreign keys that are commonly used in content platforms
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_other_user_id ON public.conversation_participants(other_user_id);
CREATE INDEX IF NOT EXISTS idx_feeds_user_id ON public.feeds(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_creator_id ON public.follows(creator_id);
CREATE INDEX IF NOT EXISTS idx_membership_tiers_creator_id ON public.membership_tiers(creator_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_posts_creator_id ON public.posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_tier_id ON public.posts(tier_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier_id ON public.subscriptions(tier_id);

-- Remove indexes that are truly unused based on application logic
-- Keep the ones we added in the last migration as they address specific foreign keys
-- The "unused" status might be due to limited query history in the linter
