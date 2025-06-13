
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedEmpty } from "@/components/feed/FeedEmpty";
import { EmptyFeed } from "@/components/feed/EmptyFeed";
import { PostPreviewModal } from "@/components/explore/PostPreviewModal";
import { useFollows } from "@/hooks/useFollows";
import LoadingSpinner from "@/components/LoadingSpinner";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/components/PostCard";
import { Post } from "@/types";
import { ThumbsDown, MessageSquare, Lock } from "lucide-react";
import { useSimpleSubscriptionCheck } from "@/hooks/useSimpleSubscriptionCheck";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PostLikes } from "@/components/post/PostLikes";
import { PostComments } from "@/components/post/PostComments";
import { PostCardContent } from "@/components/post/PostCardContent";
import { useUserSubscriptions } from "@/hooks/stripe/useUserSubscriptions";
import { usePostVisibility } from "@/hooks/usePostVisibility";

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

// Component for dynamic tier access information
const TierAccessInfo = ({ post }: { post: Post }) => {
  const { subscriptionData } = useSimpleSubscriptionCheck(post.tier_id || undefined, post.authorId);
  
  // Fetch the specific tier information for this post
  const { data: tierInfo } = useQuery({
    queryKey: ['tier-info', post.tier_id],
    queryFn: async () => {
      if (!post.tier_id) return null;
      
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('id', post.tier_id)
        .single();
      
      if (error) {
        console.error('Error fetching tier info:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!post.tier_id,
  });

  // Fetch all tiers for this creator to show upgrade path
  const { data: creatorTiers } = useQuery({
    queryKey: ['creator-tiers', post.authorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', post.authorId)
        .order('price', { ascending: true });
      
      if (error) {
        console.error('Error fetching creator tiers:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!post.authorId,
  });

  // Check if user has access to this tier
  const hasAccess = subscriptionData?.isSubscribed || false;
  
  // If no tier required or user has access, don't show unlock section
  if (!post.tier_id || hasAccess) {
    return null;
  }

  // Find tiers that grant access (current tier and higher)
  const accessTiers = creatorTiers?.filter(tier => 
    tierInfo && tier.price >= tierInfo.price
  ) || [];

  // Get the lowest tier that grants access (should be the post's tier)
  const lowestAccessTier = accessTiers.length > 0 ? accessTiers[0] : tierInfo;

  if (!tierInfo) {
    return null;
  }

  // Format tier prices for display
  const tierPricesText = accessTiers.length > 1 
    ? `$${accessTiers.map(tier => tier.price).join(', $')} tiers`
    : `$${tierInfo.price} tier`;

  const handleUnlockTier = () => {
    // Navigate to creator page with tier focus
    // You might want to implement this navigation logic
    console.log(`Navigate to subscribe for tier: ${lowestAccessTier?.id}`);
    window.location.href = `/creator/${post.authorId}?tier=${lowestAccessTier?.id}`;
  };

  return (
    <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-purple-800 mb-1">
            Posted for {tierPricesText}
          </p>
          <p className="text-xs text-purple-600">
            Premium content available to subscribers
          </p>
        </div>
        <Button
          size="sm"
          className="bg-pink-500 hover:bg-pink-600 text-white"
          onClick={handleUnlockTier}
        >
          <Lock className="h-4 w-4 mr-2" />
          Unlock ${lowestAccessTier?.price || tierInfo.price}
        </Button>
      </div>
    </div>
  );
};

// Component for individual post with automatic visibility tracking
const FeedPostItem = ({ post, readPosts, markPostAsRead }: { 
  post: Post; 
  readPosts: Set<string>; 
  markPostAsRead: (postId: string) => void 
}) => {
  const postRef = usePostVisibility({
    postId: post.id,
    onPostSeen: markPostAsRead,
    threshold: 0.5,
    visibilityDuration: 2000
  });

  return (
    <div ref={postRef} className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Post Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={post.authorAvatar || "/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png"} 
              alt={post.authorName} 
            />
            <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-primary">{post.authorName}</h3>
              <span className="text-sm text-muted-foreground">{post.date}</span>
            </div>
          </div>
          {!readPosts.has(post.id) && (
            <Badge className="bg-blue-500 text-white">New</Badge>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        {/* Use PostCardContent component for proper read more functionality */}
        <PostCardContent title={post.title} content={post.content} />
        
        {/* Dynamic Tier Access Information */}
        <TierAccessInfo post={post} />

        {/* Engagement Section */}
        <div className="space-y-3">
          {/* Like/Dislike Bar with real data */}
          <div className="flex items-center gap-4 py-2">
            <PostLikes postId={post.id} />
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600"
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="text-sm">Dislike</span>
            </Button>
          </div>

          {/* Comments Section with real data */}
          <div className="border-t pt-3">
            <PostComments postId={post.id} />
          </div>
        </div>
      </div>
    </div>
  );
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

  // Check if there are any posts
  const hasPosts = followedPosts.length > 0;

  return (
    <MainLayout>
      <div className="flex min-h-screen">
        {/* Left Sidebar - My Creators */}
        <div className="w-80 bg-card border-r border-border p-4 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b-2 border-primary">
              MY CREATORS
            </h2>
            {hasFollowedCreators ? (
              <div className="space-y-3">
                {followedCreators.map((creator) => (
                  <div key={creator.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <Avatar className="h-10 w-10 ring-2 ring-muted">
                      <AvatarImage 
                        src={creator.avatar_url || "/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png"} 
                        alt={creator.username || "Creator"} 
                      />
                      <AvatarFallback className="text-sm">
                        {(creator.username || "C").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-foreground truncate">
                        {creator.username}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {creator.bio || "Creator"}
                      </p>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="link" 
                  className="text-primary text-sm p-0 h-auto mt-4"
                >
                  Manage my subscriptions
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  No creators followed yet
                </p>
                <Button size="sm">Discover Creators</Button>
              </div>
            )}
          </div>
        </div>

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

            {!hasFollowedCreators ? (
              <EmptyFeed />
            ) : (
              <>
                {/* Service Notification Banner - Show only for pending cancellations */}
                {hasPendingCancellations && (
                  <div className="mb-6 p-4 bg-yellow-100 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm">!</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          You have subscriptions that are scheduled to cancel at the end of your current billing period. 
                          You'll continue to have access until then. To prevent cancellation, go to{" "}
                          <button 
                            className="underline font-medium"
                            onClick={() => window.location.href = '/subscriptions'}
                          >
                            Your Subscriptions
                          </button>
                          {" "}and reactivate your subscriptions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feed Tabs */}
                <Tabs defaultValue="all" className="mb-8">
                  <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start p-0">
                    <TabsTrigger 
                      value="all"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                      All Posts
                    </TabsTrigger>
                    <TabsTrigger 
                      value="unread"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                      Unread
                      {unreadCount > 0 && (
                        <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">{unreadCount}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="saved"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
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
                      <div className="space-y-6">
                        {followedPosts.map((post) => (
                          <FeedPostItem
                            key={post.id}
                            post={post}
                            readPosts={readPosts}
                            markPostAsRead={markPostAsRead}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Unread Tab */}
                  <TabsContent value="unread" className="mt-6 space-y-6">
                    {unreadCount > 0 ? (
                      <div className="space-y-6">
                        {unreadPosts.map((post) => (
                          <FeedPostItem
                            key={post.id}
                            post={post}
                            readPosts={readPosts}
                            markPostAsRead={markPostAsRead}
                          />
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
              </>
            )}
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
