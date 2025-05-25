
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

  // Fetch creator's posts
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
            price
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
      
      // Transform to CreatorPost format with mock data for fields we don't yet have
      return data.map((post): CreatorPost => {
        // Safely access user data with proper null handling
        const username = post.users?.username || 'Unknown Creator';
        const profilePicture = post.users?.profile_picture || null;
        
        // Determine post type based on tags or content keywords
        let postType: "article" | "image" | "video" | "audio" = "article";
        
        // Check if post has tags and determine type from tags
        const tags = post.title
          ?.split(' ')
          .filter(word => word.length > 3)
          .slice(0, 3)
          .map(tag => tag.toLowerCase().replace(/[^a-z0-9]/g, ''));

        // Check for type keywords in tags first, then in title/content
        if (tags) {
          if (tags.some(tag => ['image', 'photo', 'picture', 'art', 'design'].includes(tag))) {
            postType = "image";
          } else if (tags.some(tag => ['video', 'tutorial', 'stream', 'recording'].includes(tag))) {
            postType = "video";
          } else if (tags.some(tag => ['audio', 'podcast', 'song', 'music', 'sound'].includes(tag))) {
            postType = "audio";
          } else if (tags.some(tag => ['article', 'blog', 'write', 'tutorial'].includes(tag))) {
            postType = "article";
          }
        }
        
        // Fallback to checking title and content if no tags match
        if (postType === "article") {
          const typeKeywords: Record<string, string[]> = {
            image: ["image", "photo", "picture", "art", "design"],
            video: ["video", "tutorial", "stream", "recording"],
            audio: ["audio", "podcast", "song", "music", "sound"],
            article: ["blog", "article", "write", "tutorial"]
          };
          
          for (const [type, keywords] of Object.entries(typeKeywords)) {
            if (keywords.some(keyword => 
              post.title?.toLowerCase().includes(keyword) || 
              post.content?.toLowerCase().includes(keyword))
            ) {
              postType = type as any;
              break;
            }
          }
        }

        // Create a proper format for tier display
        const availableTiers = post.membership_tiers ? [{
          id: post.membership_tiers.id,
          name: post.membership_tiers.title,
          // Assign color based on price for visual distinction - Convert price to string before parsing
          color: determineColorByPrice(parseFloat(String(post.membership_tiers.price)))
        }] : [];

        // Determine post status (in a real app would be from a status column)
        const isScheduled = post.title?.toLowerCase().includes('scheduled');
        const isDraft = post.title?.toLowerCase().includes('draft');
        const status: PostStatus = isScheduled ? "scheduled" : isDraft ? "draft" : "published";
        
        // Generate engagement metrics (would be real metrics in production)
        const randomEngagement = generateRandomEngagement(status);
          
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          authorName: username,
          authorAvatar: profilePicture,
          createdAt: post.created_at,
          date: formatRelativeDate(post.created_at),
          tier_id: post.tier_id,
          status,
          tags,
          engagement: randomEngagement,
          availableTiers,
          scheduleDate: isScheduled ? generateFutureDate() : undefined,
          lastEdited: formatRelativeDate(post.created_at),
          type: postType
        };
      });
    },
    enabled: !!user?.id
  });

  // Helper function to determine tier color based on price
  function determineColorByPrice(price: number): string {
    if (price === 0) return "green"; // Free tier
    if (price < 5) return "blue"; // Basic tier
    if (price < 15) return "purple"; // Premium tier
    return "indigo"; // VIP tier
  }

  // Helper function to generate mock engagement data
  function generateRandomEngagement(status: PostStatus) {
    if (status === "draft") return { views: 0, likes: 0, comments: 0 };
    if (status === "scheduled") return { views: 0, likes: 0, comments: 0 };
    
    // For published posts, generate reasonable mock data
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
