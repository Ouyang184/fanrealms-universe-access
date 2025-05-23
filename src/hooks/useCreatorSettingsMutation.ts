
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
      
      console.log('=== MUTATION START ===');
      console.log('Updating display name for user:', user.id);
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
        console.log('Executing creator update...');
        
        const { error: updateError } = await supabase
          .from('creators')
          .update(creatorUpdates)
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('Error updating display name:', updateError);
          throw updateError;
        }
        
        console.log('Update completed successfully');
        
        // Fetch the updated data to verify the update worked
        console.log('Fetching updated data for user:', user.id);
        const { data: updatedCreator, error: fetchError } = await supabase
          .from('creators')
          .select('*, users:user_id(username, email)')
          .eq('user_id', user.id)
          .single();
        
        if (fetchError) {
          console.error('Error fetching updated data:', fetchError);
          throw fetchError;
        }
        
        if (!updatedCreator) {
          console.error('No data returned after update');
          throw new Error('Failed to fetch updated creator data');
        }
        
        console.log('Updated data:', updatedCreator);
        
        // Format and return the updated data
        const formattedData = formatCreatorData(updatedCreator);
        console.log('Formatted updated data:', formattedData);
        
        return formattedData;
      }
      
      // If no creator updates, return current settings
      return settings;
    },
    onSuccess: (updatedData) => {
      console.log('=== MUTATION SUCCESS ===');
      console.log('Final updated data:', updatedData);
      
      // Immediately update all related query caches with the fresh data
      queryClient.setQueryData(['creator-settings', user?.id], updatedData);
      queryClient.setQueryData(['creatorProfile', user?.id], updatedData);
      queryClient.setQueryData(['creatorProfileDetails', user?.id], updatedData);
      queryClient.setQueryData(['creator-profile', user?.id], updatedData);
      
      // Also invalidate to trigger refetch in case other components need fresh data
      queryClient.invalidateQueries({ queryKey: ['creator-settings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creatorProfile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creatorProfileDetails', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creator-profile', user?.id] });
      
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
