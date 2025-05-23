
export interface CreatorSettings {
  id: string;
  user_id: string;
  username?: string;
  fullName?: string;
  email?: string;
  bio?: string;
  display_name?: string;
  displayName?: string;
  avatar_url?: string;
  profile_image_url?: string;
  banner_url?: string;
  tags?: string[];
  created_at?: string;
}

export interface SubscriberWithDetails {
  id: string;
  name: string;
  email: string;
  tier: string;
  tierPrice: number;
  subscriptionDate: string;
  avatarUrl?: string;
  status?: 'active' | 'expired' | 'pending';
}

export interface CreatorPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorAvatar: string | null;
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
  lastEdited?: string;
  type: "article" | "image" | "video" | "audio";
}
