

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
  website: string | null;
  bannerImageUrl?: string | null;
  created_at: string;
  user_id: string;
}

