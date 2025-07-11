
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { PostPreviewModal } from "@/components/explore/PostPreviewModal";
import { useFollows } from "@/hooks/useFollows";
import LoadingSpinner from "@/components/LoadingSpinner";
import { usePosts } from "@/hooks/usePosts";
import { Post } from "@/types";
import { useUserSubscriptions } from "@/hooks/stripe/useUserSubscriptions";
import { FeedSidebar } from "@/components/feed/FeedSidebar";
import { FeedMainContent } from "@/components/feed/FeedMainContent";
import { usePostReads } from "@/hooks/usePostReads";
import { useIsMobile } from "@/hooks/use-mobile";

export default function FeedPage() {
  // Set document title when component mounts
  useEffect(() => {
    document.title = "Feed | Creator Platform";
  }, []);

  // Get user's followed creators
  const { data: followedCreators = [], isLoading: loadingFollows } = useFollows();
  
  // Fetch posts
  const { data: posts, isLoading: loadingPosts } = usePosts();
  
  // Get user's subscriptions to check for pending cancellations
  const { userSubscriptions = [] } = useUserSubscriptions();
  
  // Get post reads data
  const { readPostIds, markAsRead, isLoading: loadingReads } = usePostReads();
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Check if user has subscriptions that are active but scheduled to cancel
  const hasPendingCancellations = userSubscriptions.some(
    subscription => subscription.status === 'active' && subscription.cancel_at_period_end === true
  );
  
  // Handle post preview with proper modal state management
  const handlePostPreview = (post: Post) => {
    console.log('Feed: Opening preview for post:', post.title);
    
    // Close any existing modal first
    if (isPreviewOpen) {
      setIsPreviewOpen(false);
      setSelectedPost(null);
    }
    
    // Small delay to ensure previous modal is closed before opening new one
    setTimeout(() => {
      setSelectedPost(post);
      setIsPreviewOpen(true);
      // Mark as read when user opens the preview modal
      markAsRead(post.id);
    }, 50);
  };

  // Handle modal close with proper cleanup
  const handleModalClose = (open: boolean) => {
    console.log('Feed: Modal close triggered, open:', open);
    setIsPreviewOpen(open);
    if (!open) {
      // Clear selected post when modal is closed
      setTimeout(() => setSelectedPost(null), 200);
    }
  };
  
  // If still loading followed creators, posts, or reads, show loading state
  if (loadingFollows || loadingPosts || loadingReads) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }
  
  // Check if user has followed creators
  const hasFollowedCreators = followedCreators && followedCreators.length > 0;

  // Get the creator user IDs from followed creators
  const followedCreatorUserIds = followedCreators.map(creator => creator.user_id).filter(Boolean);
  
  console.log('Followed creators:', followedCreators);
  console.log('Followed creator user IDs:', followedCreatorUserIds);
  console.log('All posts:', posts);
  console.log('Read post IDs:', Array.from(readPostIds));
  
  // Filter posts by matching the post's authorId with the user_id of followed creators
  const followedPosts = posts?.filter(post => {
    // Check if the post authorId matches any of the followed creator user_ids
    const isFromFollowedCreator = followedCreatorUserIds.includes(post.authorId);
    console.log(`Checking post "${post.title}" by ${post.authorName} (${post.authorId}) against followed creator user IDs: ${isFromFollowedCreator ? 'MATCH' : 'NO MATCH'}`);
    return isFromFollowedCreator;
  }) || [];
  
  console.log('Filtered followed posts:', followedPosts);
  
  // Calculate unread posts based on database read status
  const unreadPosts = followedPosts.filter(post => !readPostIds.has(post.id));
  const unreadCount = unreadPosts.length;

  console.log('Unread posts count:', unreadCount);
  console.log('Unread posts:', unreadPosts.map(p => `${p.title} (${p.id})`));

  // Create a map of creator user_id to creator info for easy lookup
  const creatorInfoMap = followedCreators.reduce((acc, creator) => {
    if (creator.user_id) {
      acc[creator.user_id] = creator;
    }
    return acc;
  }, {} as Record<string, any>);

  return (
    <MainLayout>
      <div className="flex flex-col lg:flex-row min-h-0 gap-4 lg:gap-6">
        {/* Left Sidebar - Hidden on mobile, shown as drawer or collapsed on tablet/desktop */}
        {!isMobile && (
          <div className="w-full lg:w-80 flex-shrink-0">
            <FeedSidebar 
              followedCreators={followedCreators}
              hasFollowedCreators={hasFollowedCreators}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 py-4 lg:py-6">
              {/* Mobile Sidebar Info */}
              {isMobile && hasFollowedCreators && (
                <div className="mb-4 p-3 bg-card rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    Following {followedCreators.length} creator{followedCreators.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Main Feed Content */}
              <FeedMainContent
                hasFollowedCreators={hasFollowedCreators}
                hasPendingCancellations={hasPendingCancellations}
                followedPosts={followedPosts}
                unreadPosts={unreadPosts}
                unreadCount={unreadCount}
                readPostIds={readPostIds}
                markAsRead={markAsRead}
                creatorInfoMap={creatorInfoMap}
                onPostClick={handlePostPreview}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Single Post Preview Modal with proper state management */}
      {selectedPost && (
        <PostPreviewModal
          open={isPreviewOpen}
          onOpenChange={handleModalClose}
          post={selectedPost}
        />
      )}
    </MainLayout>
  );
}
