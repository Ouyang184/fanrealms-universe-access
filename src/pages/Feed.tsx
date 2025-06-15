
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

// Helper function to load read posts from localStorage synchronously
const getReadPostsFromStorage = (): Set<string> => {
  try {
    const savedReadPosts = localStorage.getItem('readPosts');
    if (savedReadPosts) {
      return new Set(JSON.parse(savedReadPosts));
    }
  } catch (error) {
    console.error('Error loading read posts from localStorage:', error);
  }
  return new Set();
};

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
  
  // Initialize read posts from localStorage synchronously to prevent flickering
  const [readPosts, setReadPosts] = useState<Set<string>>(() => getReadPostsFromStorage());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Check if user has subscriptions that are active but scheduled to cancel
  const hasPendingCancellations = userSubscriptions.some(
    subscription => subscription.status === 'active' && subscription.cancel_at_period_end === true
  );
  
  // Save read posts to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('readPosts', JSON.stringify(Array.from(readPosts)));
    } catch (error) {
      console.error('Error saving read posts to localStorage:', error);
    }
  }, [readPosts]);
  
  // Mark a post as read
  const markPostAsRead = (postId: string) => {
    setReadPosts(prev => {
      const newReadPosts = new Set([...prev, postId]);
      console.log(`Marking post ${postId} as read. Total read posts:`, newReadPosts.size);
      return newReadPosts;
    });
  };
  
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
      markPostAsRead(post.id);
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
  
  // If still loading followed creators or posts, show loading state
  if (loadingFollows || loadingPosts) {
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
  console.log('Read posts from state:', Array.from(readPosts));
  
  // Filter posts by matching the post's authorId with the user_id of followed creators
  const followedPosts = posts?.filter(post => {
    // Check if the post authorId matches any of the followed creator user_ids
    const isFromFollowedCreator = followedCreatorUserIds.includes(post.authorId);
    console.log(`Checking post "${post.title}" by ${post.authorName} (${post.authorId}) against followed creator user IDs: ${isFromFollowedCreator ? 'MATCH' : 'NO MATCH'}`);
    return isFromFollowedCreator;
  }) || [];
  
  console.log('Filtered followed posts:', followedPosts);
  
  // Calculate unread posts based on what user hasn't seen
  const unreadPosts = followedPosts.filter(post => !readPosts.has(post.id));
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
      <div className="flex min-h-screen">
        {/* Left Sidebar */}
        <FeedSidebar 
          followedCreators={followedCreators}
          hasFollowedCreators={hasFollowedCreators}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-6">
            {/* Navigation Tabs */}
            <div className="mb-6">
              <div className="flex items-center gap-8 border-b border-border">
                <button className="pb-3 px-1 text-sm font-medium text-muted-foreground border-b-2 border-transparent hover:text-foreground hover:border-muted">
                  MY CREATORS
                </button>
                <button className="pb-3 px-1 text-sm font-medium text-foreground border-b-2 border-primary">
                  FEED
                </button>
                <button className="pb-3 px-1 text-sm font-medium text-muted-foreground border-b-2 border-transparent hover:text-foreground hover:border-muted">
                  SERVICE NOTIFICATIONS
                </button>
              </div>
            </div>

            {/* Main Feed Content */}
            <FeedMainContent
              hasFollowedCreators={hasFollowedCreators}
              hasPendingCancellations={hasPendingCancellations}
              followedPosts={followedPosts}
              unreadPosts={unreadPosts}
              unreadCount={unreadCount}
              readPosts={readPosts}
              markPostAsRead={markPostAsRead}
              creatorInfoMap={creatorInfoMap}
            />
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
