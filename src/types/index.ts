import { User } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

export type Tables = Database['public']['Tables'];

// Extend core types to match our database schema
export type DbUser = Tables['users']['Row'] & {
  website?: string | null; // Add website field to match our database schema
  updated_at?: string; // Add updated_at field from the database
};
export type DbPost = Tables['posts']['Row'];
export type DbCreator = Tables['creators']['Row'] & {
  banner_url?: string | null; // Add banner_url field for creator profiles
};
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

export interface CreatorProfile {
  id: string;
  user_id: string;
  username?: string;
  fullName?: string;
  email?: string;
  bio?: string | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
  website?: string | null;
  banner_url: string | null; // Changed from optional to required to match DbCreator
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
