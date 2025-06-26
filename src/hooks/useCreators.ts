
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CreatorProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export const useCreators = () => {
  const { user } = useAuth();

  // All creators - public data
  const { 
    data: creators = [], 
    isLoading: isLoadingCreators,
    error: creatorsError
  } = useQuery({
    queryKey: ['allCreators'],
    queryFn: async () => {
      console.log('[useCreators] Fetching all creators');
      
      const { data, error } = await supabase
        .from('creators')
        .select(`
          *,
          users:user_id (
            username,
            email,
            profile_picture
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useCreators] Error fetching creators:', error);
        throw error;
      }

      console.log('[useCreators] Fetched creators:', data?.length);
      
      return (data as any)?.map((creator: any) => {
        // Map the database fields to the expected interface structure
        return {
          id: creator.id,
          user_id: creator.user_id,
          username: creator.users?.username || 'Unknown',
          displayName: creator.display_name || creator.users?.username || 'Creator',
          display_name: creator.display_name,
          fullName: creator.users?.username || 'Creator',
          email: creator.users?.email,
          bio: creator.bio || 'No bio available',
          profile_image_url: creator.profile_image_url,
          avatar_url: creator.profile_image_url || creator.users?.profile_picture,
          banner_url: creator.banner_url,
          follower_count: creator.follower_count || 0,
          tags: creator.tags || [],
          is_nsfw: creator.is_nsfw || false,
          created_at: creator.created_at,
          website: creator.website,
          stripe_account_id: creator.stripe_account_id,
          stripe_onboarding_complete: creator.stripe_onboarding_complete,
          stripe_charges_enabled: creator.stripe_charges_enabled,
          stripe_payouts_enabled: creator.stripe_payouts_enabled
        } as CreatorProfile;
      }) || [];
    },
    staleTime: 300000, // 5 minutes
  });

  // Followed creators for the current user
  const { 
    data: followedCreators = [], 
    isLoading: isLoadingFollowed,
    error: followedError
  } = useQuery({
    queryKey: ['followedCreators', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('[useCreators] Fetching followed creators for user:', user.id);
      
      const { data, error } = await supabase
        .from('follows')
        .select(`
          creator_id,
          creators (
            *,
            users:user_id (
              username,
              email,
              profile_picture
            )
          )
        `)
        .eq('user_id', user.id as any);

      if (error) {
        console.error('[useCreators] Error fetching followed creators:', error);
        throw error;
      }

      console.log('[useCreators] Fetched followed creators:', data?.length);

      return (data as any)?.map((follow: any) => {
        const creator = follow.creators;
        if (!creator) return null;
        
        return {
          id: creator.id,
          user_id: (creator as any).user_id,
          username: creator.users?.username || 'Unknown',
          displayName: creator.display_name || creator.users?.username || 'Creator',
          display_name: creator.display_name,
          fullName: creator.users?.username || 'Creator',
          email: creator.users?.email,
          bio: creator.bio || 'No bio available',
          profile_image_url: creator.profile_image_url,
          avatar_url: creator.profile_image_url || creator.users?.profile_picture,
          banner_url: creator.banner_url,
          follower_count: creator.follower_count || 0,
          tags: creator.tags || [],
          is_nsfw: creator.is_nsfw || false,
          created_at: creator.created_at,
          website: creator.website,
          stripe_account_id: creator.stripe_account_id,
          stripe_onboarding_complete: creator.stripe_onboarding_complete,
          stripe_charges_enabled: creator.stripe_charges_enabled,
          stripe_payouts_enabled: creator.stripe_payouts_enabled
        } as CreatorProfile;
      }).filter(Boolean) || [];
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });

  // Popular creators based on follower count
  const { 
    data: popularCreators = [], 
    isLoading: isLoadingPopular,
    error: popularError
  } = useQuery({
    queryKey: ['popularCreators'],
    queryFn: async () => {
      console.log('[useCreators] Fetching popular creators');
      
      const { data, error } = await supabase
        .from('creators')
        .select(`
          *,
          users:user_id (
            username,
            email,
            profile_picture
          )
        `)
        .order('follower_count', { ascending: false })
        .limit(10);

      if (error) {
        console.error('[useCreators] Error fetching popular creators:', error);
        throw error;
      }

      console.log('[useCreators] Fetched popular creators:', data?.length);
      
      return (data as any)?.map((creator: any) => {
        return {
          id: creator.id,
          user_id: creator.user_id,
          username: creator.users?.username || 'Unknown',
          displayName: creator.display_name || creator.users?.username || 'Creator',
          display_name: creator.display_name,
          fullName: creator.users?.username || 'Creator',
          email: creator.users?.email,
          bio: creator.bio || 'No bio available',
          profile_image_url: creator.profile_image_url,
          avatar_url: creator.profile_image_url || creator.users?.profile_picture,
          banner_url: creator.banner_url,
          follower_count: creator.follower_count || 0,
          tags: creator.tags || [],
          is_nsfw: creator.is_nsfw || false,
          created_at: creator.created_at,
          website: creator.website,
          stripe_account_id: creator.stripe_account_id,
          stripe_onboarding_complete: creator.stripe_onboarding_complete,
          stripe_charges_enabled: creator.stripe_charges_enabled,
          stripe_payouts_enabled: creator.stripe_payouts_enabled
        } as CreatorProfile;
      }) || [];
    },
    staleTime: 300000, // 5 minutes
  });

  return {
    creators,
    followedCreators,
    popularCreators,
    isLoadingCreators,
    isLoadingFollowed,
    isLoadingPopular,
    creatorsError,
    followedError,
    popularError
  };
};
