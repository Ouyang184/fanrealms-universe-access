
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
      console.log('User ID:', user.id);
      console.log('Full updatedSettings received:', updatedSettings);
      
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
        console.log('📝 Starting database update...');
        
        // First, let's check the current value in the database
        console.log('🔍 Checking current database value...');
        const { data: beforeUpdate, error: beforeError } = await supabase
          .from('creators')
          .select('display_name, id')
          .eq('user_id', user.id)
          .single();
        
        console.log('📊 Current database value:', beforeUpdate);
        if (beforeError) console.log('❌ Error checking current value:', beforeError);
        
        // Now perform the update
        console.log('💾 Performing update with payload:', creatorUpdates);
        const updateResult = await supabase
          .from('creators')
          .update(creatorUpdates)
          .eq('user_id', user.id)
          .select('display_name, id, updated_at');
        
        console.log('📄 Raw update result:', updateResult);
        
        if (updateResult.error) {
          console.error('❌ Creator update error:', updateResult.error);
          throw updateResult.error;
        }
        
        console.log('✅ Update executed successfully');
        console.log('📋 Updated rows:', updateResult.data);
        
        // Wait a moment and check the value again
        console.log('⏱️ Waiting 100ms before verification...');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('🔍 Verifying update by checking database again...');
        const { data: afterUpdate, error: afterError } = await supabase
          .from('creators')
          .select('display_name, id, updated_at')
          .eq('user_id', user.id)
          .single();
        
        console.log('📊 Database value after update:', afterUpdate);
        if (afterError) console.log('❌ Error checking after update:', afterError);
      }
      
      // Update user fields if needed
      const userUpdates: any = {};
      if (updatedSettings.username !== undefined && updatedSettings.username !== settings?.username) {
        userUpdates.username = updatedSettings.username;
      }
      
      if (Object.keys(userUpdates).length > 0) {
        console.log('👤 Updating users table with:', userUpdates);
        
        const { error: userError } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', user.id);
        
        if (userError) {
          console.error('❌ User update error:', userError);
          // Don't throw here, just log the error
        }
      }
      
      // Fetch the updated data with additional wait
      console.log('⏱️ Waiting 200ms before final fetch...');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('📡 Fetching final updated creator data...');
      const { data: finalCreator, error: finalError } = await supabase
        .from('creators')
        .select('*, users:user_id(username, email)')
        .eq('user_id', user.id)
        .single();
      
      if (finalError || !finalCreator) {
        console.error('❌ Error fetching final creator:', finalError);
        throw new Error('Failed to fetch updated creator data');
      }
      
      console.log('📋 Fresh data from database (final):', finalCreator);
      
      // Format and return the updated data
      const formattedData = formatCreatorData(finalCreator);
      console.log('🎨 Formatted data to return:', formattedData);
      
      return formattedData;
    },
    onSuccess: (updatedData) => {
      console.log('=== MUTATION SUCCESS ===');
      console.log('🎉 Final updated data:', updatedData);
      
      // Clear and set the cache
      queryClient.removeQueries({ queryKey: ['creator-settings', user?.id] });
      queryClient.setQueryData(['creator-settings', user?.id], updatedData);
      
      // Invalidate related queries
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
      console.error('💥 Error details:', error);
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
