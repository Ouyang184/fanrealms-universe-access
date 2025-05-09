
import { useEffect } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedPostComponent } from "@/components/feed/FeedPost";
import { FeedEmpty } from "@/components/feed/FeedEmpty";
import { feedPosts } from "@/data/feedData";

export default function FeedPage() {
  // Set document title when component mounts
  useEffect(() => {
    document.title = "Feed | Creator Platform";
  }, []);

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
                <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">3</Badge>
              </TabsTrigger>
              <TabsTrigger value="saved">
                Saved
              </TabsTrigger>
            </TabsList>

            {/* All Posts Tab */}
            <TabsContent value="all" className="mt-6 space-y-6">
              {feedPosts.map((post) => (
                <FeedPostComponent key={post.id} post={post} />
              ))}
            </TabsContent>

            {/* Unread Tab */}
            <TabsContent value="unread" className="mt-6 space-y-6">
              {feedPosts
                .filter((post) => post.metadata.isNew)
                .map((post) => (
                  <FeedPostComponent key={post.id} post={post} />
                ))}
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
