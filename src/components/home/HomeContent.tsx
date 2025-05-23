
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

  // Map real posts to the content format expected by ContentTabs
  const mapPostToContent = (post: Post) => ({
    id: post.id,
    title: post.title,
    description: post.content.substring(0, 120) + (post.content.length > 120 ? '...' : ''),
    thumbnail: `/placeholder.svg?height=400&width=800&text=${encodeURIComponent(post.title)}`,
    creator: {
      id: post.authorId,
      name: post.authorName || 'Unknown Creator',
      avatar: post.authorAvatar || `/placeholder.svg?height=50&width=50&text=${(post.authorName || 'UC').substring(0, 2)}`,
    },
    type: determineContentType(post),
    date: post.date || formatRelativeDate(post.createdAt),
    preview: !post.tier_id, // Free content is previewable
  });

  // Determine content type based on post data
  const determineContentType = (post: Post) => {
    if (post.content.includes('youtube.com') || post.content.includes('vimeo.com')) {
      return 'video';
    } else if (post.content.length > 1000) {
      return 'article';
    } else {
      return 'download';
    }
  };

  // Split posts into categories for the tabs
  const forYouContent = posts.slice(0, 8).map(mapPostToContent);
  const trendingContent = posts.slice(0, 4).map(mapPostToContent);
  const recentContent = posts.slice(0, 4).map(mapPostToContent);

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
