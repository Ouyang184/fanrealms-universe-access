
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/Layout/MainLayout";
import PostCard from "@/components/PostCard";
import CreatorProfileCard from "@/components/CreatorProfileCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { usePosts } from "@/hooks/usePosts";
import { usePopularCreators } from "@/hooks/usePopularCreators";
import type { Post } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("feed");
  
  // Fetch popular creators
  const { 
    data: popularCreators = [], 
    isLoading: loadingCreators 
  } = usePopularCreators();

  // Fetch user's posts
  const { 
    data: posts = [], 
    isLoading: isLoadingPosts,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['userPosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: userPosts, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:author_id (
            username,
            profile_picture
          )
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Error fetching posts",
          description: "Failed to load your posts. Please try again.",
          variant: "destructive"
        });
        return [];
      }

      return userPosts.map((post: any) => ({
        ...post,
        authorName: post.users.username,
        authorAvatar: post.users.profile_picture,
        date: formatRelativeDate(post.created_at)
      })) as Post[];
    },
    enabled: !!user?.id
  });

  // Query to check if user is a creator
  const { 
    data: creatorProfile,
    isLoading: isLoadingCreator
  } = useQuery({
    queryKey: ['userCreator', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select(`
          *,
          membership_tiers (
            id,
            title,
            description,
            price
          )
        `)
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking creator status:', error);
        toast({
          title: "Error",
          description: "Failed to load creator profile. Please try again.",
          variant: "destructive"
        });
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-semibold mb-4">Please sign in</h2>
          <p className="text-muted-foreground mb-6">You need to be signed in to view your dashboard.</p>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  if (isLoadingPosts || isLoadingCreator || loadingCreators) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Popular Creators Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Popular Creators</h2>
          {popularCreators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {popularCreators.map((creator) => (
                <CreatorProfileCard key={creator.id} creator={creator} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No creators found.</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Recent Posts Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Recent Posts</h2>
            {creatorProfile && (
              <Button asChild>
                <Link to="/create-post">Create Post</Link>
              </Button>
            )}
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="feed">Your Feed</TabsTrigger>
              <TabsTrigger value="your-posts">Your Posts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="feed" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard key={post.id} {...post} />
                  ))
                ) : (
                  <div className="col-span-2">
                    <Card>
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground mb-4">No posts in your feed yet.</p>
                        <p className="text-sm text-muted-foreground">
                          Follow some creators to see their posts here!
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="your-posts" className="pt-6">
              {posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} {...post} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      {creatorProfile 
                        ? "You haven't created any posts yet." 
                        : "You need to be a creator to create posts."}
                    </p>
                    {creatorProfile && (
                      <Button asChild>
                        <Link to="/create-post">Create Your First Post</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </MainLayout>
  );
}
