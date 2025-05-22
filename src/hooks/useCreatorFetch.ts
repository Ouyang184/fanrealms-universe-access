
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { CreatorProfile } from "@/types";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { 
  cleanIdentifier,
  findByUsername,
  findByUserId,
  findByDisplayName,
  findByAbbreviatedUserId
} from "@/utils/creatorLookupStrategies";

export function useCreatorFetch(identifier?: string) {
  // Fetch creator profile by username or id
  const {
    data: creator,
    isLoading: isLoadingCreator,
    error: creatorError,
    refetch: refetchCreator
  } = useQuery({
    queryKey: ['creatorProfile', identifier],
    queryFn: async () => {
      if (!identifier) {
        console.log("No identifier provided to useCreatorFetch");
        return null;
      }
      
      console.log(`Fetching creator profile for identifier: "${identifier}"`);
      
      // Try different lookup strategies in sequence
      const cleaned = cleanIdentifier(identifier);
      
      // Strategy 1: Try to find by username
      let creatorProfile = await findByUsername(cleaned);
      if (creatorProfile) {
        console.log("Found creator by username:", creatorProfile);
        // Make sure id is set (needed for social links)
        creatorProfile.id = creatorProfile.id || creatorProfile.user_id;
        return creatorProfile;
      }
      
      // Strategy 2: Try to find creator directly by user_id
      creatorProfile = await findByUserId(cleaned);
      if (creatorProfile) {
        console.log("Found creator by user_id:", creatorProfile);
        // Make sure id is set (needed for social links)
        creatorProfile.id = creatorProfile.id || creatorProfile.user_id;
        return creatorProfile;
      }
      
      // Strategy 3: Try to find by display_name
      creatorProfile = await findByDisplayName(cleaned);
      if (creatorProfile) {
        console.log("Found creator by display_name:", creatorProfile);
        // Make sure id is set (needed for social links)
        creatorProfile.id = creatorProfile.id || creatorProfile.user_id;
        return creatorProfile;
      }
      
      // Strategy 4: Try to find by abbreviated user ID
      creatorProfile = await findByAbbreviatedUserId(identifier);
      if (creatorProfile) {
        console.log("Found creator by abbreviated user ID:", creatorProfile);
        // Make sure id is set (needed for social links)
        creatorProfile.id = creatorProfile.id || creatorProfile.user_id;
        return creatorProfile;
      }
      
      // If we've exhausted all lookup methods and still can't find the creator
      console.error('Creator not found by any lookup method:', identifier);
      return null;
    },
    enabled: !!identifier,
    retry: 1,
    staleTime: 30000, // Cache results for 30 seconds
    refetchOnWindowFocus: false
  });
  
  // Fetch creator's posts
  const {
    data: posts = [],
    isLoading: isLoadingPosts,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['creatorPosts', creator?.id || creator?.user_id],
    queryFn: async () => {
      const creatorId = creator?.id || creator?.user_id;
      if (!creatorId) {
        console.log("No creator ID available for fetching posts");
        return [];
      }
      
      console.log(`Fetching posts for creator ID: ${creatorId}`);
      
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:author_id (
            username,
            profile_picture
          )
        `)
        .eq('author_id', creatorId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Error",
          description: "Failed to load posts",
          variant: "destructive"
        });
        return [];
      }
      
      return postsData.map((post: any) => ({
        ...post,
        authorName: creator.display_name || post.users?.username || 'Unknown', 
        authorAvatar: post.users?.profile_picture,
        date: formatRelativeDate(post.created_at)
      }));
    },
    enabled: !!(creator?.id || creator?.user_id),
    staleTime: 60000 // Cache results for 1 minute
  });

  return {
    creator,
    posts,
    isLoadingCreator,
    isLoadingPosts,
    creatorError,
    refetchCreator,
    refetchPosts
  };
}
