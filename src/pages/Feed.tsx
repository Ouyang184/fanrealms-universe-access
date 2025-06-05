
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedEmpty } from "@/components/feed/FeedEmpty";
import { EmptyFeed } from "@/components/feed/EmptyFeed";
import { PostPreviewModal } from "@/components/explore/PostPreviewModal";
import { useFollows } from "@/hooks/useFollows";
import LoadingSpinner from "@/components/LoadingSpinner";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/components/PostCard";
import { Post } from "@/types";

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
  
  // Initialize read posts from localStorage synchronously to prevent flickering
  const [readPosts, setReadPosts] = useState<Set<string>>(() => getReadPostsFromStorage());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
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

  // If user has no followed creators, show the empty feed state
  if (!hasFollowedCreators) {
    return (
      <MainLayout>
        <div className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold">Your Feed</h1>
                <p className="text-muted-foreground">Follow creators to see their posts here</p>
              </div>
            </div>
            <EmptyFeed />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Get the creator user IDs from followed creators (this is the key fix)
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

  // Check if there are any posts
  const hasPosts = followedPosts.length > 0;

  // Otherwise, show the regular feed with posts
  return (
    <MainLayout>
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header and filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Your Feed</h1>
              <p className="text-muted-foreground">Recent posts from creators you follow</p>
            </div>
            <FeedFilters />
          </div>

          {/* Feed Tabs */}
          <Tabs defaultValue="all" className="mb-8">
            <TabsList>
              <TabsTrigger value="all">
                All Posts
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="saved">
                Saved
              </TabsTrigger>
            </TabsList>

            {/* All Posts Tab */}
            <TabsContent value="all" className="mt-6 space-y-6">
              {!hasPosts ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No posts from creators you follow yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Posts will appear here when creators you follow publish new content.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {followedPosts.map((post) => (
                    <div key={post.id} className="relative">
                      <PostCard 
                        id={post.id}
                        title={post.title}
                        content={post.content}
                        authorName={post.authorName}
                        authorAvatar={post.authorAvatar}
                        date={post.date}
                        createdAt={post.createdAt}
                        tier_id={post.tier_id}
                        authorId={post.authorId}
                      />
                      <div className="absolute bottom-4 right-4">
                        <Button
                          size="sm"
                          onClick={() => handlePostPreview(post)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Preview
                        </Button>
                      </div>
                      {!readPosts.has(post.id) && (
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-blue-500 text-white">New</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Unread Tab */}
            <TabsContent value="unread" className="mt-6 space-y-6">
              {unreadCount > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {unreadPosts.map((post) => (
                    <div key={post.id} className="relative">
                      <PostCard 
                        id={post.id}
                        title={post.title}
                        content={post.content}
                        authorName={post.authorName}
                        authorAvatar={post.authorAvatar}
                        date={post.date}
                        createdAt={post.createdAt}
                        tier_id={post.tier_id}
                        authorId={post.authorId}
                      />
                      <div className="absolute bottom-4 right-4">
                        <Button
                          size="sm"
                          onClick={() => handlePostPreview(post)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Preview
                        </Button>
                      </div>
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-blue-500 text-white">New</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No unread posts from creators you follow.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Check back later or explore new creators to follow.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Saved Tab */}
            <TabsContent value="saved" className="mt-6">
              <FeedEmpty />
            </TabsContent>
          </Tabs>
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
