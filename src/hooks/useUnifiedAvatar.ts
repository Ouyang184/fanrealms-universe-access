import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export const useUnifiedAvatar = () => {
  const { user } = useAuth();
  const { creatorProfile } = useCreatorProfile();
  const { uploadProfileImage } = useProfile();
  const { toast } = useToast();

  // Avatar hierarchy: creator avatar > user avatar
  const getAvatarUrl = useCallback((userProfile?: any) => {
    if (creatorProfile?.profile_image_url) {
      return creatorProfile.profile_image_url;
    }
    return userProfile?.profile_picture || null;
  }, [creatorProfile?.profile_image_url]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user?.id) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload to avatars bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update based on priority: if user is creator, update creator profile, otherwise update user profile
      if (creatorProfile?.id) {
        // Update creator profile (higher priority)
        const { error: creatorError } = await supabase
          .from('creators')
          .update({ profile_image_url: publicUrl })
          .eq('user_id', user.id);
          
        if (creatorError) throw creatorError;
      } else {
        // Update user profile
        const { error: userError } = await supabase
          .from('users')
          .update({ profile_picture: publicUrl })
          .eq('id', user.id);
          
        if (userError) throw userError;
      }

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });

      return publicUrl;
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [user?.id, creatorProfile?.id, toast]);

  return {
    getAvatarUrl,
    uploadAvatar,
    isCreator: !!creatorProfile?.id
  };
};