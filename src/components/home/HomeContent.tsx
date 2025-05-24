
import { useState } from "react";
import { HeroSection } from "./HeroSection";
import { ContentTabs } from "./ContentTabs";
import { FeaturedCreators } from "./FeaturedCreators";
import { CategoriesSection } from "./CategoriesSection";
import { HowItWorks } from "./HowItWorks";
import { HomeFooter } from "./HomeFooter";
import { ContentPreviewModal } from "@/components/content/ContentPreviewModal";
import { usePosts } from "@/hooks/usePosts";
import { usePopularCreators } from "@/hooks/usePopularCreators";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { Post } from "@/types";

export function HomeContent() {
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { data: posts = [], isLoading: isLoadingPosts } = usePosts();
  const { data: creators = [], isLoading: isLoadingCreators } = usePopularCreators();

  // Helper function to get actual thumbnail from post attachments
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

    // Find first image or video attachment
    if (Array.isArray(parsedAttachments) && parsedAttachments.length > 0) {
      const firstMedia = parsedAttachments.find(att => att.type === 'image' || att.type === 'video');
      return firstMedia?.url || null;
    }
    
    return null;
  };

  // Map real posts to the content format expected by ContentTabs
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
      preview: !post.tier_id, // Free content is previewable
    };
  };

  // Determine content type based on post data
  const determineContentType = (post: Post) => {
    // Check attachments first
    const thumbnail = getPostThumbnail(post);
    if (thumbnail) {
      // If we have actual media, determine type from attachments
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
    
    // Fallback to content analysis
    if (post.content.includes('youtube.com') || post.content.includes('vimeo.com')) {
      return 'video';
    } else if (post.content.length > 1000) {
      return 'article';
    } else {
      return 'post';
    }
  };

  // Only show content if we have real posts data
  const hasRealData = posts.length > 0;
  
  // Split posts into categories for the tabs - only if we have real data
  const forYouContent = hasRealData ? posts.slice(0, 8).map(mapPostToContent) : [];
  const trendingContent = hasRealData ? posts.slice(0, 4).map(mapPostToContent) : [];
  const recentContent = hasRealData ? posts.slice(0, 4).map(mapPostToContent) : [];

  const handleCardClick = (content: any) => {
    setSelectedContent(content);
    setModalOpen(true);
  };

  return (
    <div>
      <HeroSection />
      
      <ContentTabs 
        forYouContent={forYouContent}
        trendingContent={trendingContent}
        recentContent={recentContent}
        onCardClick={handleCardClick}
        isLoading={isLoadingPosts}
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
    </div>
  );
}
