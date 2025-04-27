
import { User } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

export type Tables = Database['public']['Tables'];

// Extend core types to match our database schema
export type DbUser = Tables['users']['Row'] & {
  website?: string | null; // Add website field to match our database schema
};
export type DbPost = Tables['posts']['Row'];
export type DbCreator = Tables['creators']['Row'];
export type DbMembershipTier = Tables['membership_tiers']['Row'];

// Frontend types with computed/joined fields
export interface Post {
  id: string;  // Explicitly define as string to match DB UUID
  title: string;
  content: string;
  authorName: string;
  authorAvatar: string | null;
  created_at: string;
  date: string;
  description?: string; // Add for compatibility with existing components
  image?: string;       // Add for compatibility with existing components
  tier_id: string | null; // Make tier_id nullable but required
}

export interface Tier extends Omit<DbMembershipTier, 'creator_id'> {
  name: string;
  features: string[];
  popular?: boolean;
}

export interface CreatorProfile extends Omit<DbCreator, 'bio' | 'profile_image_url'> {
  username?: string;
  fullName?: string;
  email?: string;
  bio?: string | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
  website?: string | null;
  tiers?: Tier[];
}

export interface AuthUser extends User {}

export interface Subscription {
  id: string;
  user_id: string;
  creator_id: string;
  tier_id: string | null;
  created_at: string;
  is_paid: boolean;
  creator?: CreatorProfile;
  tier?: Tier;
}
