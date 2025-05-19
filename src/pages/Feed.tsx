
import { useEffect } from "react";
import { MainLayout } from "@/components/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedEmpty } from "@/components/feed/FeedEmpty";
import { EmptyFeed } from "@/components/feed/EmptyFeed";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { usePosts } from "@/hooks/usePosts";
import LoadingSpinner from "@/components/LoadingSpinner";
import PostCard from "@/components/PostCard";

export default function FeedPage() {
  // Set document title when component mounts
  useEffect(() => {
    document.title = "Feed | Creator Platform";
  }, []);

  // Get user's subscriptions
  const { subscriptions, loadingSubscriptions } = useSubscriptions();
  
  // Get all posts
  const { data: allPosts, isLoading: loadingPosts } = usePosts();
  
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

  // Filter posts to only include ones from creators the user follows
  const followedCreatorIds = subscriptions.map(sub => sub.creator_id);
  const feedPosts = allPosts?.filter(post => 
    post.users && followedCreatorIds.includes(post.author_id)
  ) || [];
  
  // Get unread posts (for demonstration, we're marking newer posts as unread)
  const unreadPosts = feedPosts.filter((post) => {
    // Example: Posts created in the last day are considered "unread"
    const postDate = new Date(post.created_at);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return postDate > oneDayAgo;
  });
  
  // Track saved posts (this would normally come from database)
  const savedPosts: string[] = []; // In a real app, this would be loaded from the database

  return (
    <MainLayout>
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6">
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
                <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">{unreadPosts.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="saved">
                Saved
              </TabsTrigger>
            </TabsList>

            {/* All Posts Tab */}
            <TabsContent value="all" className="mt-6">
              {feedPosts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {feedPosts.map((post) => (
                    <PostCard 
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      content={post.content}
                      authorName={post.authorName || 'Unknown Creator'}
                      authorAvatar={post.authorAvatar || undefined}
                      date={post.date}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>No posts from your followed creators yet.</p>
                </div>
              )}
            </TabsContent>

            {/* Unread Tab */}
            <TabsContent value="unread" className="mt-6">
              {unreadPosts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {unreadPosts.map((post) => (
                    <PostCard 
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      content={post.content}
                      authorName={post.authorName || 'Unknown Creator'}
                      authorAvatar={post.authorAvatar || undefined}
                      date={post.date}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>No new unread posts.</p>
                </div>
              )}
            </TabsContent>

            {/* Saved Tab */}
            <TabsContent value="saved" className="mt-6">
              {savedPosts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {feedPosts
                    .filter(post => savedPosts.includes(post.id))
                    .map((post) => (
                      <PostCard 
                        key={post.id}
                        id={post.id}
                        title={post.title}
                        content={post.content}
                        authorName={post.authorName || 'Unknown Creator'}
                        authorAvatar={post.authorAvatar || undefined}
                        date={post.date}
                      />
                    ))}
                </div>
              ) : (
                <FeedEmpty />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
