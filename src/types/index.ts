
import { User } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

export type Tables = Database['public']['Tables'];

// Extend core types to match our database schema
export type DbUser = Tables['users']['Row'];
export type DbPost = Tables['posts']['Row'];
export type DbCreator = Tables['creators']['Row'];
export type DbMembershipTier = Tables['membership_tiers']['Row'];

// Frontend types with computed/joined fields
export interface Post extends Omit<DbPost, 'author_id'> {
  id: string;  // Explicitly define as string to match DB UUID
  authorName: string;
  authorAvatar: string | null;
  date: string;
  // Add these for compatibility with existing components
  description?: string;
  image?: string;
}

export interface Tier extends Omit<DbMembershipTier, 'creator_id'> {
  name: string;
  features: string[];
  popular?: boolean;
}

export interface CreatorProfile extends DbCreator {
  id: string;  // Explicitly define as string to match DB UUID
  username?: string;
  fullName?: string;
  email?: string;
  bio?: string | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
  website?: string | null;
  tiers?: Tier[];
}

export type AuthUser = User;
