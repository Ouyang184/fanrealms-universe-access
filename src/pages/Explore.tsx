
import React from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import PostCard from "@/components/PostCard";
import CreatorProfileCard from "@/components/CreatorProfileCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { ContentCardSkeleton } from "@/components/ContentCardSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useCreators } from "@/hooks/useCreators";

export default function Explore() {
  const { isChecking } = useAuthCheck(false); // Allow public access
  const { toast } = useToast();

  // Fetch creators and posts
  const { 
    data: creators = [], 
    isLoading: isLoadingCreators, 
    error: creatorsError 
  } = useCreators();

  const { 
    data: posts = [], 
    isLoading: isLoadingPosts, 
    error: postsError 
  } = usePosts();

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center">
      <ContentCardSkeleton />
    </div>;
  }

  const hasErrors = creatorsError || postsError;
  if (hasErrors) {
    toast({
      variant: "destructive",
      title: "Error loading content",
      description: "Please try refreshing the page.",
    });
  }

  return (
    <MainLayout>
      <div className="space-y-10">
        {/* Popular Creators Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Popular Creators</h2>
          {isLoadingCreators ? (
            <div className="grid grid-flow-col auto-cols-[280px] gap-4 pb-4 overflow-x-auto">
              {[1, 2, 3, 4].map(i => (
                <CreatorProfileCard key={i} creator={{}} isLoading={true} />
              ))}
            </div>
          ) : creators.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap rounded-lg">
              <div className="flex space-x-4 pb-4">
                {creators.map((creator) => (
                  <div key={creator.id} className="w-[280px] flex-none">
                    <CreatorProfileCard creator={creator} />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No creators available yet.
              </AlertDescription>
            </Alert>
          )}
        </section>

        {/* Latest Posts Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Latest Posts</h2>
          {isLoadingPosts ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <PostCard 
                  key={i} 
                  isLoading={true} 
                  id="" 
                  title="" 
                  content="" 
                  authorName="" 
                  created_at="" 
                  authorAvatar={null} 
                  date=""
                />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  {...post}
                  image={`https://picsum.photos/seed/${post.id}/800/450`}
                />
              ))}
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No posts available yet.
              </AlertDescription>
            </Alert>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
