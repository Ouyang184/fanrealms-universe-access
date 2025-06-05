
export interface CreatorSettingsData {
  id: string;
  user_id: string;
  email?: string;
  username?: string;
  display_name?: string;
  bio?: string;
  profile_image_url?: string;
  avatar_url?: string;
  banner_url?: string;
  tags?: string[];
  is_nsfw?: boolean;
  created_at?: string;
}

export interface CreatorUpdateData {
  display_name?: string;
  bio?: string;
  profile_image_url?: string;
  banner_url?: string;
  tags?: string[];
  is_nsfw?: boolean;
}
