
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
  authorName: string;
  authorAvatar: string | null;
  date: string;
}

export interface Tier extends Omit<DbMembershipTier, 'creator_id'> {
  name: string;
  features: string[];
  popular?: boolean;
}

export interface CreatorProfile extends DbCreator {
  username?: string;
  fullName?: string;
  email?: string;
  tiers?: Tier[];
}

export type AuthUser = User;
