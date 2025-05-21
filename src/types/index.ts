
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
  image?: string;
  tier_id?: string | null;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  username: string;
  fullName?: string;
  email: string;
  bio?: string | null;
  website?: string | null;
  display_name?: string | null;
  displayName?: string; // Add this field for compatibility
  avatar_url?: string;
  profile_image_url?: string;
  banner_url?: string | null;
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
  }
}
