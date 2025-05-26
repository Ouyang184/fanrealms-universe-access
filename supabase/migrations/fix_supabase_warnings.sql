
-- Fix missing RLS policies for tables that need them

-- Enable RLS on tables that don't have it but should
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for creators table
CREATE POLICY "Anyone can view creators" ON public.creators
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own creator profile" ON public.creators
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own creator profile" ON public.creators
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for posts table
CREATE POLICY "Anyone can view posts" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create posts as creators" ON public.posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND 
    EXISTS (SELECT 1 FROM creators WHERE user_id = auth.uid() AND id = creator_id)
  );

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- Create RLS policies for membership_tiers table
CREATE POLICY "Anyone can view membership tiers" ON public.membership_tiers
  FOR SELECT USING (true);

CREATE POLICY "Creators can manage their own tiers" ON public.membership_tiers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM creators WHERE user_id = auth.uid() AND id = creator_id)
  );

-- Create RLS policies for comments table
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for likes table
CREATE POLICY "Anyone can view likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for follows table
CREATE POLICY "Anyone can view follows" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create follows" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follows" ON public.follows
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for subscriptions table
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Creators can view their subscribers" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM creators WHERE user_id = auth.uid() AND id = creator_id)
  );

CREATE POLICY "Authenticated users can create subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for creator_subscriptions table
CREATE POLICY "Users can view their own creator subscriptions" ON public.creator_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Creators can view their subscription data" ON public.creator_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM creators WHERE user_id = auth.uid() AND id = creator_id)
  );

-- Create RLS policies for creator_earnings table
CREATE POLICY "Creators can view their own earnings" ON public.creator_earnings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM creators WHERE user_id = auth.uid() AND id = creator_id)
  );

-- Create RLS policies for creator_links table
CREATE POLICY "Anyone can view creator links" ON public.creator_links
  FOR SELECT USING (true);

CREATE POLICY "Creators can manage their own links" ON public.creator_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM creators WHERE user_id = auth.uid() AND id = creator_id)
  );

-- Create RLS policies for stripe_customers table
CREATE POLICY "Users can view their own stripe customer data" ON public.stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own stripe customer data" ON public.stripe_customers
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for feeds table
CREATE POLICY "Users can view their own feed" ON public.feeds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage feeds" ON public.feeds
  FOR ALL USING (true);

-- Create RLS policies for notifications table
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for messages table
CREATE POLICY "Users can view messages they sent or received" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Create RLS policies for conversation_participants table
CREATE POLICY "Users can view their own conversation participants" ON public.conversation_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own conversation participants" ON public.conversation_participants
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for conversations table
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

-- Add missing foreign key constraints where appropriate
-- Note: We avoid referencing auth.users directly as recommended

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_creator_id ON public.posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_creator_id ON public.follows(creator_id);
CREATE INDEX IF NOT EXISTS idx_follows_user_id ON public.follows(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON public.creators(user_id);

-- Fix any missing triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers where missing
DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON public.comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_creator_subscriptions_updated_at ON public.creator_subscriptions;
CREATE TRIGGER update_creator_subscriptions_updated_at 
    BEFORE UPDATE ON public.creator_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_customers_updated_at ON public.stripe_customers;
CREATE TRIGGER update_stripe_customers_updated_at 
    BEFORE UPDATE ON public.stripe_customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON public.conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
