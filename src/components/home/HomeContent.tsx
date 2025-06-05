
import { useState } from "react";
import { HeroSection } from "./HeroSection";
import { ContentTabs } from "./ContentTabs";
import { FeaturedCreators } from "./FeaturedCreators";
import { CategoriesSection } from "./CategoriesSection";
import { HowItWorks } from "./HowItWorks";
import { HomeFooter } from "./HomeFooter";
import { PostPreviewModal } from "@/components/explore/PostPreviewModal";
import { usePosts } from "@/hooks/usePosts";
import { usePostsByCategories } from "@/hooks/usePostsByCategories";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { usePopularCreators } from "@/hooks/usePopularCreators";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { Post } from "@/types";

export function HomeContent() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  
  // Get user preferences
  const { data: userPreferences = [], isLoading: isLoadingPreferences } = useUserPreferences();
  const categoryIds = userPreferences.map(pref => pref.category_id);
  
  // Get posts filtered by user preferences for "For You" section (with fallback to all posts)
  const { data: forYouPosts = [], isLoading: isLoadingForYou } = usePostsByCategories(categoryIds);
  
  // Get all posts for trending and recent sections
  const { data: allPosts = [], isLoading: isLoadingPosts } = usePosts();
  const { data: creators = [], isLoading: isLoadingCreators } = usePopularCreators();

  const getPostThumbnail = (post: Post) => {
    if (!post.attachments) return null;
    
    let parsedAttachments = [];
    if (typeof post.attachments === 'string' && post.attachments !== "undefined") {
      try {
        parsedAttachments = JSON.parse(post.attachments);
      } catch {
        return null;
      }
    } else if (Array.isArray(post.attachments)) {
      parsedAttachments = post.attachments;
    } else if (post.attachments && typeof post.attachments === 'object' && post.attachments.value) {
      if (typeof post.attachments.value === 'string' && post.attachments.value !== "undefined") {
        try {
          parsedAttachments = JSON.parse(post.attachments.value);
        } catch {
          return null;
        }
      } else if (Array.isArray(post.attachments.value)) {
        parsedAttachments = post.attachments.value;
      }
    }

    if (Array.isArray(parsedAttachments) && parsedAttachments.length > 0) {
      const firstMedia = parsedAttachments.find(att => att.type === 'image' || att.type === 'video');
      return firstMedia?.url || null;
    }
    
    return null;
  };

  const mapPostToContentItem = (post: Post) => {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      authorName: post.authorName || 'Creator',
      authorAvatar: post.authorAvatar || null,
      createdAt: post.createdAt,
      date: post.date || formatRelativeDate(post.createdAt),
      tier_id: post.tier_id,
      attachments: post.attachments,
    };
  };

  // Use filtered posts for "For You" (includes fallback) and regular posts for other sections
  const hasForYouData = forYouPosts.length > 0;
  const hasGeneralData = allPosts.length > 0;
  
  // Map to ContentItem format
  const forYouContentItems = hasForYouData ? forYouPosts.slice(0, 8).map(mapPostToContentItem) : [];
  const trendingPosts = hasGeneralData ? allPosts.slice(0, 4).map(mapPostToContentItem) : [];
  const recentPosts = hasGeneralData ? allPosts.slice(0, 4).map(mapPostToContentItem) : [];

  const handlePostClick = (post: Post) => {
    console.log('HomeContent: Post clicked, opening modal for:', post.title);
    setSelectedPost(post);
    setPostModalOpen(true);
  };

  const handleModalClose = () => {
    console.log('HomeContent: Closing post modal');
    setPostModalOpen(false);
    setSelectedPost(null);
  };

  return (
    <div>
      <HeroSection />
      
      <ContentTabs 
        forYouPosts={forYouContentItems}
        trendingPosts={trendingPosts}
        recentPosts={recentPosts}
        onPostClick={handlePostClick}
        isLoading={isLoadingForYou || isLoadingPosts}
      />
      
      <FeaturedCreators creators={creators} isLoading={isLoadingCreators} />
      <CategoriesSection />
      <HowItWorks />
      <HomeFooter />

      {/* Single Post Preview Modal */}
      <PostPreviewModal
        open={postModalOpen}
        onOpenChange={handleModalClose}
        post={selectedPost}
      />
    </div>
  );
}
