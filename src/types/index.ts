
import { Database } from '@/integrations/supabase/types';

export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbPost = Database['public']['Tables']['posts']['Row'];
export type DbCreator = Database['public']['Tables']['creators']['Row'];
export type DbSubscription = Database['public']['Tables']['subscriptions']['Row'];
export type DbTier = Database['public']['Tables']['membership_tiers']['Row'];
export type DbCreatorSubscription = Database['public']['Tables']['creator_subscriptions']['Row'];
export type DbCreatorEarnings = Database['public']['Tables']['creator_earnings']['Row'];

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  authorName?: string;
  authorAvatar?: string | null;
  date?: string;
  tier_id?: string | null;
  attachments?: any; // JSON from database
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  display_name: string;
  displayName: string;
  username: string;
  fullName: string;
  email: string;
  bio: string;
  avatar_url: string;
  profile_image_url: string;
  banner_url: string;
  website?: string;
  follower_count?: number; // Use follower_count to match database
  following_count?: number;
  tags?: string[];
  created_at: string;
  tiers?: Tier[];
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
}

export interface Tier {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  subscriberCount?: number;
  stripe_price_id?: string | null;
}

export interface Subscription {
  id: string;
  userId: string;
  creatorId: string;
  tierId: string | null;
  startDate: string;
  endDate: string | null;
  tier?: Tier;
}

export interface StripeSubscription {
  id: string;
  user_id: string;
  creator_id: string;
  tier_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  amount_paid: number | null;
  platform_fee: number | null;
  creator_earnings: number | null;
  created_at: string;
}

export interface CreatorEarnings {
  id: string;
  creator_id: string;
  subscription_id: string | null;
  amount: number;
  platform_fee: number;
  net_amount: number;
  stripe_transfer_id: string | null;
  payment_date: string | null;
  created_at: string;
}

// Add Tables namespace for Supabase compatibility
export namespace Tables {
  export interface Post {
    title: string;
    content: string;
    author_id: string;
    tier_id?: string | null;
    attachments?: any;
  }
}
