
import { useState } from "react";
import { HeroSection } from "./HeroSection";
import { ContentTabs } from "./ContentTabs";
import { FeaturedCreators } from "./FeaturedCreators";
import { CategoriesSection } from "./CategoriesSection";
import { CommissionSection } from "./CommissionSection";
import { HowItWorks } from "./HowItWorks";
import { HomeFooter } from "./HomeFooter";
import { PostPreviewModal } from "@/components/explore/PostPreviewModal";
import { usePosts } from "@/hooks/usePosts";
import { usePostsByCategories } from "@/hooks/usePostsByCategories";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { usePopularCreators } from "@/hooks/usePopularCreators";
import { useNSFWPreferences } from "@/hooks/useNSFWPreferences";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { Post } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function HomeContent() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  
  // Get NSFW preferences to trigger re-render when changed
  const { data: nsfwPrefs } = useNSFWPreferences();
  
  // Get user preferences
  const { data: userPreferences = [], isLoading: isLoadingPreferences } = useUserPreferences();
  const categoryIds = userPreferences.map(pref => pref.category_id);
  
  // Get posts filtered by user preferences for "For You" section
  const { data: categoryPosts = [], isLoading: isLoadingCategoryPosts } = usePostsByCategories(categoryIds);
  
  // Get all posts for trending and recent sections, and as fallback for "For You"
  const { data: allPosts = [], isLoading: isLoadingPosts } = usePosts();
  const { data: creators = [], isLoading: isLoadingCreators } = usePopularCreators();

  // Determine "For You" posts: use category-filtered posts if available, otherwise recent posts
  const forYouPosts = categoryPosts.length > 0 ? categoryPosts : allPosts.slice(0, 8);

  console.log('HomeContent: For You logic:', {
    userPreferences: userPreferences.length,
    categoryIds,
    categoryPostsCount: categoryPosts.length,
    allPostsCount: allPosts.length,
    forYouPostsCount: forYouPosts.length,
    usingCategoryPosts: categoryPosts.length > 0
  });

  // Fetch detailed creator information for all posts
  const { data: creatorsMap = {} } = useQuery({
    queryKey: ['home-creators-info', [...forYouPosts, ...allPosts].map(p => p.authorId)],
    queryFn: async () => {
      const allHomePosts = [...forYouPosts, ...allPosts];
      if (allHomePosts.length === 0) return {};
      
      const authorIds = [...new Set(allHomePosts.map(post => post.authorId))];
      
      console.log('HomeContent: Fetching creator info for author IDs:', authorIds);
      
      const { data: creatorsData, error } = await supabase
        .rpc('get_public_creators_by_user_ids', { p_user_ids: authorIds });
      
      if (error) {
        console.error('HomeContent: Error fetching creators:', error);
        return {};
      }
      
      console.log('HomeContent: Fetched creators data:', creatorsData);
      
      // Create a map from user_id to creator info
      const creatorsMap = creatorsData?.reduce((acc, creator) => {
        acc[creator.user_id] = creator;
        return acc;
      }, {} as Record<string, any>) || {};
      
      console.log('HomeContent: Created creators map:', creatorsMap);
      
      return creatorsMap;
    },
    enabled: forYouPosts.length > 0 || allPosts.length > 0,
  });

  console.log('HomeContent: NSFW preferences:', nsfwPrefs?.isNSFWEnabled);
  console.log('HomeContent: Posts count after NSFW filtering:', {
    forYouPosts: forYouPosts.length,
    allPosts: allPosts.length
  });

  const mapPostToContentItem = (post: Post) => {
    const creatorInfo = creatorsMap[post.authorId];
    
    console.log('HomeContent: Mapping post to content item:', {
      postId: post.id,
      postTitle: post.title,
      authorId: post.authorId,
      creatorInfo,
      finalName: creatorInfo?.display_name || post.authorName || 'Creator',
      finalAvatar: creatorInfo?.profile_image_url || post.authorAvatar
    });
    
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      authorName: creatorInfo?.display_name || post.authorName || 'Creator',
      authorAvatar: creatorInfo?.profile_image_url || post.authorAvatar || null,
      createdAt: post.createdAt,
      date: post.date || formatRelativeDate(post.createdAt),
      tier_id: post.tier_id,
      attachments: post.attachments,
    };
  };

  // Use the computed forYouPosts and regular posts for other sections
  const hasForYouData = forYouPosts.length > 0;
  const hasGeneralData = allPosts.length > 0;
  
  // Map to ContentItem format - ensuring creator info is properly passed
  const forYouContentItems = hasForYouData ? forYouPosts.slice(0, 8).map(mapPostToContentItem) : [];
  const trendingPosts = hasGeneralData ? allPosts.slice(0, 4).map(mapPostToContentItem) : [];
  const recentPosts = hasGeneralData ? allPosts.slice(0, 4).map(mapPostToContentItem) : [];

  const handlePostClick = (post: Post) => {
    console.log('HomeContent: Post clicked, opening modal for:', post.title);
    
    // Clear any existing modal state first
    if (postModalOpen) {
      setPostModalOpen(false);
      setSelectedPost(null);
    }
    
    // Small delay to ensure clean state before opening new modal
    setTimeout(() => {
      setSelectedPost(post);
      setPostModalOpen(true);
    }, 50);
  };

  const handleModalClose = (open: boolean) => {
    console.log('HomeContent: Modal close triggered, open:', open);
    setPostModalOpen(open);
    if (!open) {
      // Clear selected post when modal is closed
      setTimeout(() => setSelectedPost(null), 200);
    }
  };

  return (
    <div>
      <HeroSection />
      
      <ContentTabs 
        forYouPosts={forYouContentItems}
        trendingPosts={trendingPosts}
        recentPosts={recentPosts}
        onPostClick={handlePostClick}
        isLoading={isLoadingCategoryPosts || isLoadingPosts}
      />
      
      <CommissionSection />
      <FeaturedCreators creators={creators} isLoading={isLoadingCreators} />
      <CategoriesSection />
      <HowItWorks />
      <HomeFooter />

      {/* Single Post Preview Modal with proper state management */}
      {selectedPost && (
        <PostPreviewModal
          open={postModalOpen}
          onOpenChange={handleModalClose}
          post={selectedPost}
        />
      )}
    </div>
  );
}
