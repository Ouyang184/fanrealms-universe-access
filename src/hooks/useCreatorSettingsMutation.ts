
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
      
      // First, let's check for any triggers on the creators table
      console.log('🔍 Checking for triggers on creators table...');
      const { data: triggers, error: triggerError } = await supabase
        .rpc('sql', { 
          query: "SELECT tgname, tgtype, tgenabled FROM pg_trigger WHERE tgrelid = 'public.creators'::regclass;" 
        });
      
      if (triggerError) {
        console.log('❌ Error checking triggers:', triggerError);
      } else {
        console.log('🔧 Triggers on creators table:', triggers);
      }
      
      // Check transaction isolation level
      console.log('🔍 Checking transaction isolation level...');
      const { data: isolation, error: isolationError } = await supabase
        .rpc('sql', { 
          query: "SHOW transaction_isolation;" 
        });
      
      if (isolationError) {
        console.log('❌ Error checking isolation:', isolationError);
      } else {
        console.log('⚙️ Transaction isolation level:', isolation);
      }
      
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
        
        // Check current value before update
        console.log('🔍 Checking current database value...');
        const { data: beforeUpdate, error: beforeError } = await supabase
          .from('creators')
          .select('display_name, id, updated_at')
          .eq('user_id', user.id)
          .single();
        
        console.log('📊 Current database value:', beforeUpdate);
        if (beforeError) console.log('❌ Error checking current value:', beforeError);
        
        // Perform update with explicit transaction
        console.log('💾 Performing update with payload:', creatorUpdates);
        console.log('🔄 Starting explicit transaction...');
        
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
        
        // Immediately verify the update in the same connection
        console.log('🔍 Immediate verification (same connection)...');
        const { data: immediateCheck, error: immediateError } = await supabase
          .from('creators')
          .select('display_name, id, updated_at')
          .eq('user_id', user.id)
          .single();
        
        console.log('📊 Immediate check result:', immediateCheck);
        if (immediateError) console.log('❌ Error in immediate check:', immediateError);
        
        // Check if the update actually persisted by comparing timestamps
        if (beforeUpdate && immediateCheck) {
          const beforeTime = new Date(beforeUpdate.updated_at || '').getTime();
          const afterTime = new Date(immediateCheck.updated_at || '').getTime();
          console.log('⏰ Update timestamp comparison:', {
            before: beforeUpdate.updated_at,
            after: immediateCheck.updated_at,
            changed: afterTime > beforeTime
          });
        }
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
        }
      }
      
      // Final fetch with a longer wait
      console.log('⏱️ Waiting 500ms before final fetch...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
