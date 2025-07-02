
import { Database } from '@/integrations/supabase/types';

export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbPost = Database['public']['Tables']['posts']['Row'];
export type DbCreator = Database['public']['Tables']['creators']['Row'];
export type DbSubscription = Database['public']['Tables']['subscriptions']['Row'];
export type DbTier = Database['public']['Tables']['membership_tiers']['Row'];
export type DbUserSubscription = Database['public']['Tables']['user_subscriptions']['Row'];
export type DbCreatorEarnings = Database['public']['Tables']['creator_earnings']['Row'];

// Commission types will be added once the database schema is updated
// export type DbCommissionType = Database['public']['Tables']['commission_types']['Row'];
// export type DbCommissionRequest = Database['public']['Tables']['commission_requests']['Row'];
// export type DbCommissionSlot = Database['public']['Tables']['commission_slots']['Row'];

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
  authorName?: string;
  authorAvatar?: string | null;
  authorId: string;
  createdAt: string;
  date?: string;
  tier_id?: string | null;
  attachments?: any;
  tags?: string[]; // Added tags field for search functionality
  is_nsfw?: boolean; // Added NSFW flag for content filtering
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  username?: string;
  displayName?: string;
  display_name?: string;
  fullName?: string;
  email?: string;
  bio?: string;
  profile_image_url?: string;
  avatar_url?: string;
  banner_url?: string;
  follower_count?: number;
  tags?: string[];
  is_nsfw?: boolean;
  created_at?: string;
  tiers?: Tier[];
  website?: string;
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  accepts_commissions?: boolean;
  commission_info?: any;
  commission_tos?: string;
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

export interface UserSubscription {
  id: string;
  user_id: string;
  creator_id: string;
  tier_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string;
  amount: number;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
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

export interface CommissionType {
  id: string;
  creator_id: string;
  name: string;
  description?: string;
  base_price: number;
  min_price?: number;
  max_price?: number;
  estimated_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommissionRequest {
  id: string;
  customer_id: string;
  creator_id: string;
  commission_type_id?: string;
  slot_id?: string;
  title: string;
  description: string;
  reference_images: string[];
  agreed_price?: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'revision' | 'completed' | 'cancelled' | 'rejected';
  deadline?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionSlot {
  id: string;
  creator_id: string;
  commission_type_id?: string;
  start_date: string;
  end_date?: string;
  max_slots: number;
  available_slots: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
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
