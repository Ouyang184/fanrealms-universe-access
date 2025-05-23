
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
        .limit(1);
        
      if (error) {
        console.error('Error fetching creator settings:', error);
        toast({
          title: "Error",
          description: "Failed to load creator settings. Please refresh the page.",
          variant: "destructive",
        });
        return null;
      }
      
      if (!data || data.length === 0) {
        console.log('No creator data found for user:', user.id);
        return null;
      }
      
      const creatorData = data[0];
      console.log('Fetched creator data:', creatorData);
      
      // Format the data to match CreatorSettings interface
      const formattedData = {
        id: creatorData.id,
        user_id: creatorData.user_id,
        username: creatorData.users?.username || '',
        fullName: creatorData.users?.username || '',
        email: creatorData.users?.email || '',
        bio: creatorData.bio || '',
        display_name: creatorData.display_name || '',
        displayName: creatorData.display_name || '', // Keep in sync with display_name
        avatar_url: creatorData.profile_image_url,
        profile_image_url: creatorData.profile_image_url,
        banner_url: creatorData.banner_url,
        tags: creatorData.tags || [],
        created_at: creatorData.created_at
      } as CreatorSettings;
      
      console.log('Formatted creator settings:', formattedData);
      
      return formattedData;
    },
    enabled: !!user?.id,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data in memory
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on component mount
  });

  return {
    settings,
    isLoading,
    refetch
  };
};
