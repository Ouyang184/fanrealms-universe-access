
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

  // Fetch creator's posts with subscription and tier info
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['creator-posts', user?.id, filter, searchQuery, showDrafts],
    queryFn: async () => {
      if (!user?.id) return [];
      
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
          )
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
      
      // Transform to CreatorPost format
      return data.map((post): CreatorPost => {
        const username = post.users?.username || 'Unknown Creator';
        const profilePicture = post.users?.profile_picture || null;
        
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
        const isLocked = !!post.tier_id; // Post is locked if it has a tier_id

        console.log('[useCreatorPosts] Creator post visibility check:', {
          postId: post.id,
          postTitle: post.title,
          tierId: post.tier_id,
          authorId: post.author_id, // Log the authorId being set
          isCreatorOwnPost: true,
          canViewPost,
          isLocked
        });

        // Create tier display info
        const availableTiers = post.membership_tiers ? [{
          id: post.membership_tiers.id,
          name: post.membership_tiers.title,
          color: determineColorByPrice(parseFloat(String(post.membership_tiers.price)))
        }] : [];

        // Determine post status
        const isScheduled = post.title?.toLowerCase().includes('scheduled');
        const isDraft = post.title?.toLowerCase().includes('draft');
        const status: PostStatus = isScheduled ? "scheduled" : isDraft ? "draft" : "published";
        
        const randomEngagement = generateRandomEngagement(status);

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
          
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          authorName: username,
          authorAvatar: profilePicture,
          createdAt: post.created_at,
          date: formatRelativeDate(post.created_at),
          tier_id: post.tier_id,
          authorId: post.author_id, // FIXED: Ensure authorId is properly set
          status,
          tags,
          engagement: randomEngagement,
          availableTiers,
          scheduleDate: isScheduled ? generateFutureDate() : undefined,
          lastEdited: formatRelativeDate(post.created_at),
          type: postType,
          canView: canViewPost,
          isLocked: isLocked,
          attachments: attachments
        };
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

  // Helper function to generate mock engagement data
  function generateRandomEngagement(status: PostStatus) {
    if (status === "draft") return { views: 0, likes: 0, comments: 0 };
    if (status === "scheduled") return { views: 0, likes: 0, comments: 0 };
    
    return {
      views: Math.floor(Math.random() * 2000) + 200,
      likes: Math.floor(Math.random() * 150) + 10,
      comments: Math.floor(Math.random() * 50) + 1
    };
  }

  // Helper function to generate future date for scheduled posts
  function generateFutureDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 14) + 1);
    return date.toISOString();
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
