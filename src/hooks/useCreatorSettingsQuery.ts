
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CreatorSettings } from '@/types/creator-studio';

export const useCreatorSettingsQuery = () => {
  const { user } = useAuth();

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['creator-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('Fetching creator settings for user:', user.id);
      
      const { data, error } = await supabase
        .from('creators')
        .select('*, users:user_id(username, email)')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching creator settings:', error);
        toast({
          title: "Error",
          description: "Failed to load creator settings. Please refresh the page.",
          variant: "destructive",
        });
        return null;
      }
      
      console.log('Fetched creator data:', data);
      
      // Format the data to match CreatorSettings interface
      // Make sure display_name takes priority and is consistent
      const formattedData = {
        id: data.id,
        user_id: data.user_id,
        username: data.users?.username || '',
        fullName: data.users?.username || '',
        email: data.users?.email || '',
        bio: data.bio || '',
        display_name: data.display_name || '', // Use the actual display_name from database
        displayName: data.display_name || '', // Keep this in sync
        avatar_url: data.profile_image_url,
        profile_image_url: data.profile_image_url,
        banner_url: data.banner_url,
        tags: data.tags || [],
        created_at: data.created_at
      } as CreatorSettings;
      
      console.log('Formatted creator settings:', formattedData);
      
      return formattedData;
    },
    enabled: !!user?.id,
  });

  return {
    settings,
    isLoading,
    refetch
  };
};
