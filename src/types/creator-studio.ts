
export interface CreatorPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: string;
  date: string;
  tier_id?: string | null;
  status: "published" | "scheduled" | "draft";
  tags?: string[];
  engagement?: {
    views: number;
    likes: number;
    comments: number;
  };
  availableTiers?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  scheduleDate?: string;
  lastEdited: string;
  type: "article" | "image" | "video" | "audio";
  canView?: boolean;
  isLocked?: boolean;
}

export interface CreatorSettings {
  id: string;
  user_id: string;
  username?: string;
  email?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  profile_image_url?: string;
  banner_url?: string;
  tags?: string[];
  website_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  linkedin_url?: string;
  github_url?: string;
  banner_image?: string;
  created_at?: string;
}

export interface SubscriberWithDetails {
  id: string;
  user_id: string;
  creator_id: string;
  tier_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  current_period_end?: string;
  stripe_subscription_id?: string;
  // Additional properties that components expect
  name: string;
  email: string;
  avatarUrl?: string;
  tier: string;
  tierPrice: number;
  subscriptionDate: string;
  amount?: number;
  users: {
    username: string;
    email: string;
    profile_picture?: string;
  };
  membership_tiers: {
    title: string;
    price: number;
  };
  user?: {
    username: string;
    email: string;
    profile_picture?: string;
  };
}
