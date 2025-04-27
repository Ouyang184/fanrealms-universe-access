
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/Layout/MainLayout";
import PostCard from "@/components/PostCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatRelativeDate } from "@/utils/auth-helpers";
import type { Post } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("posts");
  
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
          description: error.message,
          variant: "destructive"
        });
        return [];
      }

      return userPosts.map((post: any) => ({
        ...post,
        authorName: post.users.username,
        authorAvatar: post.users.profile_picture,
        date: formatRelativeDate(post.created_at),
        description: post.content // Add description for PostCard component
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
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking creator status:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  // Set up real-time listener for user's posts
  useEffect(() => {
    if (!user?.id) return;

    const postsChannel = supabase
      .channel(`user-posts-${user.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'posts',
          filter: `author_id=eq.${user.id}` 
        }, 
        () => {
          console.log('User posts changed, refreshing data');
          refetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [user?.id, refetchPosts]);

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
  
  return (
    <MainLayout showTabs={true}>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Your Dashboard</h1>
            <p className="text-muted-foreground">Manage your content and track your performance</p>
          </div>
          <Button asChild>
            <Link to="/create-post">Create Post</Link>
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="posts">Your Posts</TabsTrigger>
            <TabsTrigger value="purchases">Your Purchases</TabsTrigger>
            {creatorProfile && (
              <TabsTrigger value="creator">Creator Dashboard</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="posts" className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoadingPosts ? (
                <>
                  <PostCard isLoading={true} id="" title="" content="" created_at="" authorName="" authorAvatar="" date="" />
                  <PostCard isLoading={true} id="" title="" content="" created_at="" authorName="" authorAvatar="" date="" />
                </>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard 
                    key={post.id}
                    id={post.id}
                    title={post.title}
                    content={post.content}
                    description={post.content}
                    image={`https://picsum.photos/seed/${post.id}/800/450`} // Placeholder for now
                    authorName={post.authorName}
                    authorAvatar={post.authorAvatar || ''}
                    date={post.date}
                    created_at={post.created_at}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <p className="text-muted-foreground mb-4">No posts yet. Create your first post!</p>
                  <Button asChild>
                    <Link to="/create-post">Create Post</Link>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="purchases" className="pt-6">
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">You haven't made any purchases yet.</p>
                <Button asChild>
                  <Link to="/explore">Explore Creators</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {creatorProfile && (
            <TabsContent value="creator" className="pt-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Creator Dashboard</h2>
                  <Button variant="outline" asChild>
                    <Link to="/settings">Edit Profile</Link>
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-medium mb-2">Total Posts</h3>
                      <p className="text-3xl font-bold">{posts.length}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-medium mb-2">Subscribers</h3>
                      <p className="text-3xl font-bold">0</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-medium mb-2">Revenue</h3>
                      <p className="text-3xl font-bold">$0</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardContent className="py-6">
                    <h3 className="font-medium mb-4">Membership Tiers</h3>
                    <p className="text-muted-foreground mb-4">You haven't set up any membership tiers yet.</p>
                    <Button>Create Tier</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
