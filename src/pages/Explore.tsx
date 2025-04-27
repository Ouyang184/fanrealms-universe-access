
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import LoadingSpinner from "@/components/LoadingSpinner";
import PostCard from "@/components/PostCard";
import CreatorProfileCard from "@/components/CreatorProfileCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatRelativeDate } from "@/utils/auth-helpers";
import type { Post, CreatorProfile } from "@/types";
import { useToast } from "@/components/ui/use-toast";

export default function Explore() {
  const { isChecking } = useAuthCheck(false); // Allow public access
  const [activeTab, setActiveTab] = useState("posts");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch posts with author info
  const { data: posts = [], isLoading: isLoadingPosts, refetch: refetchPosts } = useQuery({
    queryKey: ['explorePosts'],
    queryFn: async () => {
      const { data: explorePosts, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:author_id (
            username,
            profile_picture
          )
        `)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Error fetching posts",
          description: "Failed to load posts. Please try again.",
          variant: "destructive"
        });
        return [];
      }

      return explorePosts.map((post: any) => ({
        ...post,
        authorName: post.users.username,
        authorAvatar: post.users.profile_picture,
        date: formatRelativeDate(post.created_at)
      })) as Post[];
    }
  });

  // Fetch creators with their tier information
  const { data: creators = [], isLoading: isLoadingCreators, refetch: refetchCreators } = useQuery({
    queryKey: ['creators'],
    queryFn: async () => {
      const { data: creatorData, error } = await supabase
        .from('creators')
        .select(`
          *,
          users:user_id (
            username,
            email,
            profile_picture
          ),
          membership_tiers (
            id,
            title,
            description,
            price
          )
        `)
        .limit(8);

      if (error) {
        console.error('Error fetching creators:', error);
        toast({
          title: "Error fetching creators",
          description: "Failed to load creators. Please try again.",
          variant: "destructive"
        });
        return [];
      }

      return creatorData.map((creator: any) => ({
        ...creator,
        username: creator.users?.username,
        email: creator.users?.email,
        avatar_url: creator.users?.profile_picture,
        fullName: creator.users?.username,
        tiers: creator.membership_tiers?.map((tier: any) => ({
          ...tier,
          name: tier.title,
          features: [tier.description]
        }))
      })) as CreatorProfile[];
    }
  });

  // Set up real-time listeners for posts and creators
  useEffect(() => {
    const postsChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' }, 
        () => {
          console.log('Posts changed, refreshing data');
          refetchPosts();
        }
      )
      .subscribe();

    const creatorsChannel = supabase
      .channel('public:creators')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'creators' },
        () => {
          console.log('Creators changed, refreshing data');
          refetchCreators();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(creatorsChannel);
    };
  }, [refetchPosts, refetchCreators]);

  // Filter content based on search query
  const filteredPosts = searchQuery 
    ? posts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  const filteredCreators = searchQuery
    ? creators.filter(creator => 
        creator.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : creators;

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Explore</h1>
          <p className="text-muted-foreground">Discover popular content and creators</p>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search content and creators..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="posts">Content</TabsTrigger>
            <TabsTrigger value="creators">Creators</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-4">
            {isLoadingPosts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <PostCard key={i} isLoading={true} id="" title="" content="" created_at="" authorName="" authorAvatar="" date="" />
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    {...post}
                    image={`https://picsum.photos/seed/${post.id}/800/450`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No content found matching your search.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="creators" className="mt-4">
            {isLoadingCreators ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <CreatorProfileCard key={i} creator={{}} isLoading={true} />
                ))}
              </div>
            ) : filteredCreators.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredCreators.map((creator) => (
                  <CreatorProfileCard key={creator.id} creator={creator} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No creators found matching your search.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
