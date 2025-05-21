
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Link } from "react-router-dom";
import PostCard from "@/components/PostCard";
import { formatRelativeDate } from "@/utils/auth-helpers";
import type { CreatorProfile, Post } from "@/types";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { toast } from "@/hooks/use-toast";

export default function CreatorProfile() {
  const { user } = useAuth();
  const { creatorProfile } = useCreatorProfile();
  const [activeTab, setActiveTab] = useState("posts");

  // Fetch creator's details from the database
  const { 
    data: creator, 
    isLoading: isLoadingCreator,
  } = useQuery({
    queryKey: ['creatorProfileDetails', user?.id],
    queryFn: async () => {
      if (!user?.id || !creatorProfile) return null;
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userError || !userData) {
        console.error('Error fetching user:', userError);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive"
        });
        return null;
      }
      
      return {
        ...creatorProfile,
        username: userData.username,
        fullName: userData.username,
        email: userData.email,
        avatar_url: userData.profile_picture,
        banner_url: creatorProfile.banner_url || null,
        bio: creatorProfile.bio || "No bio provided yet.",
      } as CreatorProfile;
    },
    enabled: !!user?.id && !!creatorProfile
  });
  
  // Fetch creator's posts
  const {
    data: posts = [], 
    isLoading: isLoadingPosts,
  } = useQuery({
    queryKey: ['creatorProfilePosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: postsData, error } = await supabase
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
          title: "Error",
          description: "Failed to load posts",
          variant: "destructive"
        });
        return [];
      }
      
      return postsData.map((post: any) => ({
        ...post,
        authorName: post.users.username,
        authorAvatar: post.users.profile_picture,
        date: formatRelativeDate(post.created_at)
      })) as Post[];
    },
    enabled: !!user?.id
  });

  // Fetch membership tiers
  const {
    data: tiers = [],
    isLoading: isLoadingTiers,
  } = useQuery({
    queryKey: ['creatorProfileTiers', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id) return [];
      
      const { data: tiersData, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .order('price', { ascending: true });
      
      if (error) {
        console.error('Error fetching tiers:', error);
        toast({
          title: "Error",
          description: "Failed to load membership tiers",
          variant: "destructive"
        });
        return [];
      }
      
      // Count subscribers for each tier
      const tiersWithSubscribers = await Promise.all(tiersData.map(async (tier) => {
        const { count, error: countError } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('tier_id', tier.id);
          
        return {
          ...tier,
          name: tier.title,
          features: [tier.description],
          subscriberCount: count || 0
        };
      }));
      
      return tiersWithSubscribers;
    },
    enabled: !!creatorProfile?.id
  });

  if (isLoadingCreator || !creator) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  const displayName = creator.fullName || creator.username || "Creator";
  const avatarUrl = creator.avatar_url || creator.profile_image_url;
  const bannerImage = creator.banner_url || "/default-banner.jpg";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Creator Profile</h1>
        <Button asChild variant="outline">
          <Link to={`/creator/${creator.username}`}>
            View Public Profile
          </Link>
        </Button>
      </div>

      <div className="space-y-8">
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-lg overflow-hidden">
            {creator.banner_url && (
              <img 
                src={bannerImage} 
                alt="Creator Banner" 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-end p-4 -mt-16 md:-mt-12">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="text-4xl">
                {(displayName || "C").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <p className="text-muted-foreground">@{creator.username}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button asChild>
                <Link to="/creator-studio/settings">Edit Profile</Link>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="px-4">
          <p>{creator.bio || "You haven't added a bio yet. Add one in your creator settings."}</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Statistics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <p className="text-2xl font-bold">--</p>
              <p className="text-muted-foreground">Followers</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-2xl font-bold">{posts.length}</p>
              <p className="text-muted-foreground">Posts</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-2xl font-bold">{tiers.length}</p>
              <p className="text-muted-foreground">Membership Tiers</p>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="posts">Your Posts</TabsTrigger>
            <TabsTrigger value="membership">Membership Tiers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="pt-6">
            {isLoadingPosts ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <PostCard 
                    key={post.id}
                    {...post}
                    image={`https://picsum.photos/seed/${post.id}/800/450`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">You haven't created any posts yet.</p>
                <Button asChild>
                  <Link to="/creator-studio/posts">Create Your First Post</Link>
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="membership" className="pt-6">
            <div className="text-center p-8">
              <h3 className="text-xl font-semibold mb-2">Your Membership Tiers</h3>
              <p className="text-muted-foreground mb-6">These are the tiers available to your subscribers.</p>
              {isLoadingTiers ? (
                <div className="flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : tiers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {tiers.map(tier => (
                    <div key={tier.id} className="border rounded-lg p-4">
                      <h4 className="font-medium">{tier.name}</h4>
                      <p className="text-xl font-bold mt-1">${Number(tier.price).toFixed(2)}/mo</p>
                      <Badge className="mt-2">{tier.subscriberCount || 0} subscribers</Badge>
                      <ul className="mt-3">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="text-sm text-muted-foreground">{feature}</li>
                        ))}
                      </ul>
                      <Button asChild variant="outline" className="w-full mt-4">
                        <Link to="/creator-studio/membership-tiers">Manage</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="mb-4">You haven't created any membership tiers yet.</p>
                  <Button asChild>
                    <Link to="/creator-studio/membership-tiers">Create Your First Tier</Link>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
