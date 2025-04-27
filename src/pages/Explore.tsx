
import { useState } from "react";
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

export default function Explore() {
  const { isChecking } = useAuthCheck();
  const [activeTab, setActiveTab] = useState("posts");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
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
        return [];
      }

      return explorePosts.map((post: any) => ({
        ...post,
        authorName: post.users.username,
        authorAvatar: post.users.profile_picture,
        date: formatRelativeDate(post.created_at),
        description: post.content // Add description for PostCard component
      })) as Post[];
    }
  });

  const { data: creators = [], isLoading: isLoadingCreators } = useQuery({
    queryKey: ['creators'],
    queryFn: async () => {
      const { data: creatorProfiles, error } = await supabase
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
        `);

      if (error) {
        console.error('Error fetching creators:', error);
        return [];
      }

      return creatorProfiles.map((creator: any) => ({
        ...creator,
        username: creator.users?.username,
        email: creator.users?.email,
        avatar_url: creator.users?.profile_picture,
        fullName: creator.users?.username, // Using username as fullName for now
        tiers: creator.membership_tiers?.map((tier: any) => ({
          ...tier,
          name: tier.title,
          features: [tier.description],
        }))
      })) as CreatorProfile[];
    }
  });

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
