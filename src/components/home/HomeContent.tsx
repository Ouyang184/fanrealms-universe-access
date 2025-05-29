import { useState } from "react";
import { HeroSection } from "./HeroSection";
import { ContentTabs } from "./ContentTabs";
import { FeaturedCreators } from "./FeaturedCreators";
import { CategoriesSection } from "./CategoriesSection";
import { HowItWorks } from "./HowItWorks";
import { HomeFooter } from "./HomeFooter";
import { ContentPreviewModal } from "@/components/content/ContentPreviewModal";
import { PostPreviewModal } from "@/components/explore/PostPreviewModal";
import { usePosts } from "@/hooks/usePosts";
import { usePostsByCategories } from "@/hooks/usePostsByCategories";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { usePopularCreators } from "@/hooks/usePopularCreators";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { Post } from "@/types";

export function HomeContent() {
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
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

  const mapPostToContent = (post: Post) => {
    const thumbnail = getPostThumbnail(post);
    
    return {
      id: post.id,
      title: post.title,
      description: post.content.substring(0, 120) + (post.content.length > 120 ? '...' : ''),
      thumbnail: thumbnail || `/placeholder.svg?height=400&width=800&text=${encodeURIComponent(post.title)}`,
      creator: {
        id: post.authorId,
        name: post.authorName || 'Unknown Creator',
        avatar: post.authorAvatar || `/placeholder.svg?height=50&width=50&text=${(post.authorName || 'UC').substring(0, 2)}`,
      },
      type: determineContentType(post),
      date: post.date || formatRelativeDate(post.createdAt),
      preview: !post.tier_id,
    };
  };

  const determineContentType = (post: Post) => {
    const thumbnail = getPostThumbnail(post);
    if (thumbnail) {
      if (!post.attachments) return 'post';
      
      let parsedAttachments = [];
      if (typeof post.attachments === 'string' && post.attachments !== "undefined") {
        try {
          parsedAttachments = JSON.parse(post.attachments);
        } catch {
          return 'post';
        }
      } else if (Array.isArray(post.attachments)) {
        parsedAttachments = post.attachments;
      }

      if (Array.isArray(parsedAttachments) && parsedAttachments.length > 0) {
        const firstMedia = parsedAttachments[0];
        if (firstMedia.type === 'video') return 'video';
        if (firstMedia.type === 'image') return 'image';
        return 'download';
      }
    }
    
    if (post.content.includes('youtube.com') || post.content.includes('vimeo.com')) {
      return 'video';
    } else if (post.content.length > 1000) {
      return 'article';
    } else {
      return 'post';
    }
  };

  // Use filtered posts for "For You" (includes fallback) and regular posts for other sections
  const hasForYouData = forYouPosts.length > 0;
  const hasGeneralData = allPosts.length > 0;
  
  // Map to ContentItem format
  const forYouContentItems = hasForYouData ? forYouPosts.slice(0, 8).map(mapPostToContentItem) : [];
  const trendingPosts = hasGeneralData ? allPosts.slice(0, 4).map(mapPostToContentItem) : [];
  const recentPosts = hasGeneralData ? allPosts.slice(0, 4).map(mapPostToContentItem) : [];

  const handleCardClick = (content: any) => {
    setSelectedContent(content);
    setModalOpen(true);
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setPostModalOpen(true);
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
      
      {selectedContent && (
        <ContentPreviewModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          content={selectedContent}
        />
      )}

      {selectedPost && (
        <PostPreviewModal
          open={postModalOpen}
          onOpenChange={setPostModalOpen}
          post={selectedPost}
        />
      )}
    </div>
  );
}
