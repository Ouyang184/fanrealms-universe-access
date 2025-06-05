
import { CreatorSettingsData } from '@/types/creator-settings';

export const formatCreatorData = (data: any): CreatorSettingsData => {
  return {
    id: data.id,
    user_id: data.user_id,
    username: data.users?.username || '',
    email: data.users?.email || '',
    bio: data.bio || '',
    display_name: data.display_name || '',
    avatar_url: data.profile_image_url,
    profile_image_url: data.profile_image_url,
    banner_url: data.banner_url,
    tags: data.tags || [],
    is_nsfw: data.is_nsfw || false,
    created_at: data.created_at
  };
};
