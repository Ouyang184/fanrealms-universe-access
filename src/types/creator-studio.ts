
import { DbPost, Tier, DbUser, CreatorProfile } from '@/types';

// Stats for the dashboard
export interface CreatorStats {
  totalPosts: number;
  totalSubscribers: number;
  totalEarnings: number;
}

// Subscription with user details
export interface SubscriberWithDetails {
  id: string;
  name: string;
  email: string;
  tier: string;
  tierPrice: number;
  subscriptionDate: string;
  avatarUrl?: string;
}

// Payout data
export interface PayoutData {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  date: string;
}

// Creator Studio settings
export interface CreatorSettings extends CreatorProfile {
  bio: string | null;
  display_name: string | null; // Updated to non-optional
  bannerImageUrl?: string | null;
  banner_url: string | null;
  created_at: string;
  user_id: string;
}

// Extend Post for CreatorPost to include tier_id and other fields
export interface CreatorPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: string;
  date: string;
  tier_id?: string | null;
  status?: 'published' | 'scheduled' | 'draft';
  tags?: string[];
  engagement?: {
    views: number;
    likes: number;
    comments: number;
  };
  availableTiers?: {
    id: string;
    name: string;
    color: string;
  }[];
  scheduleDate?: string;
  lastEdited?: string;
  type: "article" | "image" | "video" | "audio";
}
