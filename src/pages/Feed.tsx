
import { useEffect } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedEmpty } from "@/components/feed/FeedEmpty";
import { EmptyFeed } from "@/components/feed/EmptyFeed";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import LoadingSpinner from "@/components/LoadingSpinner";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/components/PostCard";

export default function FeedPage() {
  // Set document title when component mounts
  useEffect(() => {
    document.title = "Feed | Creator Platform";
  }, []);

  // Get user's subscriptions
  const { subscriptions, loadingSubscriptions } = useSubscriptions();
  
  // Fetch posts
  const { data: posts, isLoading: loadingPosts } = usePosts();
  
  // If still loading subscriptions or posts, show loading state
  if (loadingSubscriptions || loadingPosts) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }
  
  // Check if user has subscriptions
  const hasSubscriptions = subscriptions && subscriptions.length > 0;

  // If user has no subscriptions, show the empty feed state
  if (!hasSubscriptions) {
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

  // Get the creator IDs (not user IDs) of creators the user is subscribed to
  const followedCreatorIds = subscriptions.map(sub => sub.creator_id).filter(Boolean);
  
  console.log('Followed creator IDs:', followedCreatorIds);
  console.log('All posts:', posts);
  
  // Filter posts by matching the post's author_id with creators the user follows
  // We need to check if the post author is a creator that the user follows
  const followedPosts = posts?.filter(post => {
    // Check if any of the followed creators has this post author as their user_id
    const isFromFollowedCreator = subscriptions.some(sub => {
      // Compare post author_id with creator's user_id
      const creatorUserId = sub.creator?.user_id || sub.creator?.users?.id;
      const isMatch = creatorUserId === post.authorId;
      console.log(`Checking post "${post.title}" by ${post.authorName} (${post.authorId}) against creator ${creatorUserId}: ${isMatch ? 'MATCH' : 'NO MATCH'}`);
      return isMatch;
    });
    return isFromFollowedCreator;
  }) || [];
  
  console.log('Filtered followed posts:', followedPosts);
  
  // Count unread posts (for demo purposes, assume 3 are unread)
  const unreadCount = Math.min(followedPosts.length, 3);

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
                <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">{unreadCount}</Badge>
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
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {followedPosts.map((post) => (
                    <PostCard 
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      content={post.content}
                      authorName={post.authorName}
                      authorAvatar={post.authorAvatar}
                      date={post.date}
                      createdAt={post.createdAt}
                      tier_id={post.tier_id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Unread Tab */}
            <TabsContent value="unread" className="mt-6 space-y-6">
              {unreadCount > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {followedPosts.slice(0, unreadCount).map((post) => (
                    <PostCard 
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      content={post.content}
                      authorName={post.authorName}
                      authorAvatar={post.authorAvatar}
                      date={post.date}
                      createdAt={post.createdAt}
                      tier_id={post.tier_id}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No unread posts from creators you follow.</p>
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
    </MainLayout>
  );
}
