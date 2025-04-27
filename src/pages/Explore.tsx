
import React from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import PostCard from "@/components/PostCard";
import CreatorProfileCard from "@/components/CreatorProfileCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useCreators } from "@/hooks/useCreators";

export default function Explore() {
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

  // Error handling
  if (creatorsError || postsError) {
    toast({
      variant: "destructive",
      title: "Error loading content",
      description: "Please try refreshing the page.",
    });
  }

  return (
    <MainLayout>
      <div className="space-y-10 px-4 py-6 md:px-6">
        {/* Popular Creators Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-primary">Popular Creators</h2>
          
          {isLoadingCreators ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : creators.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap rounded-lg pb-4">
              <div className="flex space-x-4">
                {creators.map((creator) => (
                  <div key={creator.id} className="w-[280px] flex-none">
                    <CreatorProfileCard creator={creator} />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <Alert className="bg-background border-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <AlertDescription className="text-center text-lg">
                No creators found yet! 🚀
              </AlertDescription>
            </Alert>
          )}
        </section>

        {/* Latest Posts Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-primary">Latest Posts</h2>
          {isLoadingPosts ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
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
                  tier_id={null}
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
            <Alert className="bg-background border-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <AlertDescription className="text-center text-lg">
                No posts available yet!
              </AlertDescription>
            </Alert>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
