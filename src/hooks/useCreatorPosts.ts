
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Post } from "@/types";
import { CreatorPost } from "@/types/creator-studio";
import { formatRelativeDate } from "@/utils/auth-helpers";

export type PostFilter = "all" | "article" | "image" | "video";
export type PostStatus = "published" | "scheduled" | "draft";

export function useCreatorPosts() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<PostFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDrafts, setShowDrafts] = useState(true);

  // Fetch creator's posts with real engagement data and multiple tiers
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['creator-posts', user?.id, filter, searchQuery, showDrafts],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('[useCreatorPosts] Fetching posts for user:', user.id);
      
      let query = supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey (
            username,
            profile_picture
          ),
          membership_tiers (
            id,
            title,
            price,
            creator_id
          ),
          post_tiers (
            tier_id,
            membership_tiers (
              id,
              title,
              price
            )
          ),
          likes(count),
          comments(count)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      // Apply search query if provided
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
        
      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Error fetching posts",
          description: "Failed to load your posts. Please try again.",
          variant: "destructive"
        });
        return [];
      }

      console.log('[useCreatorPosts] Creator posts raw data:', data);
      
      // Transform to CreatorPost format with real engagement data and multiple tiers
      return data.map((post): CreatorPost => {
        const username = post.users?.username || 'Unknown Creator';
        const profilePicture = post.users?.profile_picture || null;
        
        console.log('[useCreatorPosts] CRITICAL - Processing post with author_id:', {
          postId: post.id,
          postTitle: post.title,
          author_id: post.author_id,
          authorIdType: typeof post.author_id,
          userId: user.id,
          userIdType: typeof user.id
        });
        
        // Determine post type based on tags or content keywords
        let postType: "article" | "image" | "video" | "audio" = "article";
        
        const tags = post.title
          ?.split(' ')
          .filter(word => word.length > 3)
          .slice(0, 3)
          .map(tag => tag.toLowerCase().replace(/[^a-z0-9]/g, ''));

        if (tags) {
          if (tags.some(tag => ['image', 'photo', 'picture', 'art', 'design'].includes(tag))) {
            postType = "image";
          } else if (tags.some(tag => ['video', 'tutorial', 'stream', 'recording'].includes(tag))) {
            postType = "video";
          } else if (tags.some(tag => ['audio', 'podcast', 'song', 'music', 'sound'].includes(tag))) {
            postType = "audio";
          }
        }

        // CREATOR ALWAYS HAS FULL ACCESS to their own posts
        const canViewPost = true;
        
        // Check if post has multiple tiers or legacy single tier
        const hasMultipleTiers = post.post_tiers && post.post_tiers.length > 0;
        const hasLegacyTier = !!post.tier_id;
        const isLocked = hasMultipleTiers || hasLegacyTier;

        console.log('[useCreatorPosts] Creator post visibility check:', {
          postId: post.id,
          postTitle: post.title,
          tierId: post.tier_id,
          postTiers: post.post_tiers,
          authorId: post.author_id,
          isCreatorOwnPost: true,
          canViewPost,
          isLocked
        });

        // Create tier display info from multiple tiers
        let availableTiers: Array<{ id: string; name: string; color: string; }> = [];
        
        if (hasMultipleTiers) {
          availableTiers = post.post_tiers.map((pt: any) => ({
            id: pt.membership_tiers.id,
            name: pt.membership_tiers.title,
            color: determineColorByPrice(parseFloat(String(pt.membership_tiers.price)))
          }));
        } else if (post.membership_tiers && hasLegacyTier) {
          // Legacy single tier support
          availableTiers = [{
            id: post.membership_tiers.id,
            name: post.membership_tiers.title,
            color: determineColorByPrice(parseFloat(String(post.membership_tiers.price)))
          }];
        }

        // Determine post status from database with proper type checking
        const isValidStatus = (status: string): status is PostStatus => {
          return ['published', 'scheduled', 'draft'].includes(status);
        };
        
        let status: PostStatus = "published";
        
        // First check if the database status is valid
        if (post.status && isValidStatus(post.status)) {
          status = post.status;
          
          // Additional check: if status is 'scheduled' but scheduled_for time has passed, treat as published
          if (status === 'scheduled' && post.scheduled_for) {
            const scheduledTime = new Date(post.scheduled_for);
            const now = new Date();
            
            // If the scheduled time has passed, this should be treated as published
            // But since this is creator's own posts view, they can see all their posts regardless
            if (scheduledTime <= now) {
              console.log('[useCreatorPosts] Scheduled post time has passed, but keeping as scheduled for creator view:', {
                postId: post.id,
                scheduledFor: post.scheduled_for,
                currentTime: now.toISOString()
              });
            }
          }
        }
        
        // Use REAL engagement data from the database
        const realEngagement = {
          views: 0, // Views tracking would need to be implemented separately
          likes: Array.isArray(post.likes) ? post.likes.length : 0,
          comments: Array.isArray(post.comments) ? post.comments.length : 0
        };

        // Safely handle attachments - ensure it's a properly typed array
        const attachments: Array<{
          url: string;
          name: string;
          type: string;
          size: number;
        }> = [];

        if (post.attachments && Array.isArray(post.attachments)) {
          // Type cast the Json array to our expected format
          post.attachments.forEach((attachment: any) => {
            if (attachment && typeof attachment === 'object' && attachment.url && attachment.name && attachment.type) {
              attachments.push({
                url: String(attachment.url),
                name: String(attachment.name),
                type: String(attachment.type),
                size: Number(attachment.size) || 0
              });
            }
          });
        }

        const transformedPost: CreatorPost = {
          id: post.id,
          title: post.title,
          content: post.content,
          authorName: username,
          authorAvatar: profilePicture,
          createdAt: post.created_at,
          date: formatRelativeDate(post.created_at),
          tier_id: post.tier_id,
          authorId: post.author_id,
          status,
          tags,
          engagement: realEngagement, // Use real engagement data
          availableTiers,
          scheduleDate: post.scheduled_for || undefined,
          lastEdited: formatRelativeDate(post.created_at),
          type: postType,
          canView: canViewPost,
          isLocked: isLocked,
          attachments: attachments
        };

        console.log('[useCreatorPosts] FINAL transformed post with multiple tiers:', {
          postId: transformedPost.id,
          authorId: transformedPost.authorId,
          availableTiers: transformedPost.availableTiers,
          engagement: transformedPost.engagement,
          status: transformedPost.status,
          scheduleDate: transformedPost.scheduleDate
        });
          
        return transformedPost;
      });
    },
    enabled: !!user?.id
  });

  // Helper function to determine tier color based on price
  function determineColorByPrice(price: number): string {
    if (price === 0) return "green";
    if (price < 5) return "blue";
    if (price < 15) return "purple";
    return "indigo";
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Toggle show drafts
  const toggleShowDrafts = () => {
    setShowDrafts(prev => !prev);
  };

  // Handle filter change
  const handleFilterChange = (newFilter: PostFilter) => {
    setFilter(newFilter);
  };

  return {
    posts,
    isLoading,
    filter,
    searchQuery,
    showDrafts,
    handleSearch,
    toggleShowDrafts,
    handleFilterChange
  };
}
