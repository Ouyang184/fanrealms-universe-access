
import { User } from "@supabase/supabase-js";
import { Profile } from "@/lib/supabase";

// Define core types for the application
export interface Post {
  id: number;
  title: string;
  description: string;
  image: string;
  authorName: string;
  authorAvatar: string;
  date: string;
}

export interface Tier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface CreatorProfile extends Profile {
  bio?: string;
  coverImage?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  tiers?: Tier[];
}

export type AuthUser = User;
