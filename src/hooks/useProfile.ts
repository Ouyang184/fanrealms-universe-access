
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface ProfileData {
  id: string;
  email: string;
  username: string;
  profile_picture?: string | null;
  website?: string | null;
  created_at: string;
  bio?: string | null;
  tags?: string[];
  display_name?: string | null;
  creator_id?: string | null;
}

export const useProfile = () => {
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (userId: string): Promise<ProfileData | null> => {
    try {
      // First get the user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId as any)
        .single();
      
      if (userError) throw userError;

      // Then get the creator data if it exists
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', userId as any)
        .maybeSingle();

      // Note: creatorError is not thrown as it's optional - user might not be a creator

      // Combine the data
      const profileData: ProfileData = {
        ...(userData as any),
        bio: (creatorData as any)?.bio || null,
        tags: (creatorData as any)?.tags || [],
        display_name: (creatorData as any)?.display_name || null,
        creator_id: (creatorData as any)?.id || null
      };
      
      return profileData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, []);

  const updateProfile = useCallback(async (userId: string, data: Partial<ProfileData>) => {
    try {
      // Separate user data from creator data
      const { bio, tags, display_name, creator_id, ...userData } = data;
      const creatorData = { bio, tags, display_name };

      // Update users table
      if (Object.keys(userData).length > 0) {
        const { error: userError } = await supabase
          .from('users')
          .update(userData as any)
          .eq('id', userId as any);

        if (userError) throw userError;
      }

      // Update or create creator data if bio, tags, or display_name are provided
      if (bio !== undefined || tags !== undefined || display_name !== undefined) {
        // Check if creator record exists
        const { data: existingCreator } = await supabase
          .from('creators')
          .select('id')
          .eq('user_id', userId as any)
          .maybeSingle();

        if (existingCreator) {
          // Update existing creator record
          const { error: creatorError } = await supabase
            .from('creators')
            .update(creatorData as any)
            .eq('user_id', userId as any);

          if (creatorError) throw creatorError;
        } else {
          // Create new creator record
          const { error: creatorError } = await supabase
            .from('creators')
            .insert({
              user_id: userId,
              ...creatorData
            } as any);

          if (creatorError) throw creatorError;
        }
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      return await fetchUserProfile(userId);
      
    } catch (error: any) {
      console.error("Profile update error:", error);
      
      toast({
        title: "Failed to update profile",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [fetchUserProfile, toast]);

  const uploadProfileImage = useCallback(async (userId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/profile.${fileExt}`;
      
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl }} = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  return {
    fetchUserProfile,
    updateProfile,
    uploadProfileImage,
  };
};
