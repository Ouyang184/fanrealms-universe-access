
import { Database } from '@/integrations/supabase/types';

export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbPost = Database['public']['Tables']['posts']['Row'];
export type DbCreator = Database['public']['Tables']['creators']['Row'];
export type DbSubscription = Database['public']['Tables']['subscriptions']['Row'];
export type DbTier = Database['public']['Tables']['membership_tiers']['Row'];

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
  followers_count?: number;
  following_count?: number;
  tags?: string[];
  created_at: string;
  tiers?: Tier[];
}

export interface Tier {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  subscriberCount?: number;
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
