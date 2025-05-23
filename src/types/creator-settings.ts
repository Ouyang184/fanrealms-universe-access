
export interface CreatorSettingsData {
  id: string;
  user_id: string;
  username?: string;
  fullName?: string;
  email?: string;
  bio?: string;
  display_name?: string;
  displayName?: string; // Keep both for backward compatibility
  avatar_url?: string;
  profile_image_url?: string;
  banner_url?: string;
  tags?: string[];
  created_at?: string;
}

export interface CreatorUpdateData {
  bio?: string;
  display_name?: string;
  banner_url?: string;
  profile_image_url?: string;
  tags?: string[];
}
