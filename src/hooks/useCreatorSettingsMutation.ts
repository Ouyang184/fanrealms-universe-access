
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CreatorSettingsData, CreatorUpdateData } from '@/types/creator-settings';
import { formatCreatorData } from '@/utils/creatorDataFormatter';

export const useCreatorSettingsMutation = (settings: CreatorSettingsData | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<CreatorSettingsData>) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!settings?.id) throw new Error('Creator settings not loaded');
      
      console.log('=== MUTATION START ===');
      console.log('Updating settings for user:', user.id);
      console.log('Creator ID:', settings.id);
      console.log('Current settings:', settings);
      console.log('Updates to apply:', updatedSettings);
      
      // Extract only the fields that should be updated in the creators table
      const creatorUpdates: Partial<CreatorUpdateData> = {};
      
      if (updatedSettings.display_name !== undefined && updatedSettings.display_name !== settings?.display_name) {
        creatorUpdates.display_name = updatedSettings.display_name;
      }
      if (updatedSettings.bio !== undefined && updatedSettings.bio !== settings?.bio) {
        creatorUpdates.bio = updatedSettings.bio;
      }
      if (updatedSettings.banner_url !== undefined && updatedSettings.banner_url !== settings?.banner_url) {
        creatorUpdates.banner_url = updatedSettings.banner_url;
      }
      if (updatedSettings.profile_image_url !== undefined && updatedSettings.profile_image_url !== settings?.profile_image_url) {
        creatorUpdates.profile_image_url = updatedSettings.profile_image_url;
      }
      if (updatedSettings.avatar_url !== undefined && updatedSettings.avatar_url !== settings?.avatar_url) {
        creatorUpdates.profile_image_url = updatedSettings.avatar_url;
      }
      if (updatedSettings.tags !== undefined && JSON.stringify(updatedSettings.tags) !== JSON.stringify(settings?.tags)) {
        creatorUpdates.tags = updatedSettings.tags;
      }

      console.log('Creator updates to apply:', creatorUpdates);
      
      // Only update creators table if there are changes
      if (Object.keys(creatorUpdates).length > 0) {
        console.log('Executing creator update using user_id:', user.id);
        
        // Update using user_id instead of creator id for better reliability
        const { data: updatedData, error: updateError } = await supabase
          .from('creators')
          .update(creatorUpdates)
          .eq('user_id', user.id)
          .select('*, users:user_id(username, email)')
          .single();
        
        if (updateError) {
          console.error('Error updating creator:', updateError);
          throw updateError;
        }
        
        if (!updatedData) {
          console.error('No data returned after update');
          throw new Error('Failed to get updated creator data');
        }
        
        console.log('Update completed successfully, returned data:', updatedData);
        
        // Format and return the updated data
        const formattedData = formatCreatorData(updatedData);
        console.log('Formatted updated data:', formattedData);
        
        return formattedData;
      }
      
      // If no creator updates, return current settings
      console.log('No changes detected, returning current settings');
      return settings;
    },
    onSuccess: async (updatedData) => {
      console.log('=== MUTATION SUCCESS ===');
      console.log('Final updated data:', updatedData);
      
      // Update all related query caches with the fresh data
      queryClient.setQueryData(['creator-settings', user?.id], updatedData);
      queryClient.setQueryData(['creatorProfile', user?.id], updatedData);
      queryClient.setQueryData(['creatorProfileDetails', user?.id], updatedData);
      queryClient.setQueryData(['creator-profile', user?.id], updatedData);
      
      // Invalidate to ensure fresh data on next fetch
      await queryClient.invalidateQueries({ queryKey: ['creator-settings', user?.id] });
      
      // Small delay to let Supabase finish syncing
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Then refetch the latest values to ensure we have the most up-to-date data
      console.log('Refetching latest data after delay...');
      await queryClient.refetchQueries({ queryKey: ['creator-settings', user?.id] });
      
      toast({
        title: "Success",
        description: "Your settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('=== MUTATION ERROR ===');
      console.error('Error details:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    updateSettings: (updatedSettings: Partial<CreatorSettingsData>, options?: any) => 
      updateSettingsMutation.mutate(updatedSettings, options)
  };
};
