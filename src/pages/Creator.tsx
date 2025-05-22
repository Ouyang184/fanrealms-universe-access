
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/LoadingSpinner";
import PostCard from "@/components/PostCard";
import { supabase } from "@/lib/supabase";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { useToast } from "@/hooks/use-toast";
import type { CreatorProfile, Post } from "@/types";
import { useFollow } from "@/hooks/useFollow";
import { SocialLinks } from "@/components/SocialLinks";

const CreatorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("posts");
  const { toast } = useToast();
  const { 
    followCreator, 
    unfollowCreator, 
    isFollowing, 
    setIsFollowing, 
    isLoading: followLoading, 
    checkFollowStatus 
  } = useFollow();
  
  const { 
    data: creator, 
    isLoading: isLoadingCreator,
    refetch: refetchCreator
  } = useQuery({
    queryKey: ['creatorProfile', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', id)
        .single();
      
      if (userError || !userData) {
        console.error('Error fetching user:', userError);
        toast({
          title: "Error",
          description: "Creator not found",
          variant: "destructive"
        });
        return null;
      }
      
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select(`
          *,
          membership_tiers (
            id, 
            title,
            description,
            price,
            created_at
          )
        `)
        .eq('user_id', userData.id)
        .single();
      
      if (creatorError && creatorError.code !== 'PGRST116') {
        console.error('Error fetching creator:', creatorError);
        toast({
          title: "Error",
          description: "Failed to load creator profile",
          variant: "destructive"
        });
        return null;
      }
      
      if (!creatorData) {
        return {
          id: "",
          user_id: userData.id,
          username: userData.username,
          fullName: userData.username,
          email: userData.email,
          avatar_url: userData.profile_picture,
          banner_url: null,
          bio: null,
          created_at: userData.created_at,
          tiers: []
        } as CreatorProfile;
      }
      
      return {
        ...creatorData,
        username: userData.username,
        fullName: userData.username,
        email: userData.email,
        avatar_url: userData.profile_picture,
        banner_url: creatorData.banner_url || null,
        tiers: creatorData.membership_tiers?.map((tier: any) => ({
          ...tier,
          name: tier.title,
          features: [tier.description]
        }))
      } as CreatorProfile;
    }
  });
  
  const {
    data: posts = [], 
    isLoading: isLoadingPosts,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['creatorPosts', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('username', id)
        .single();
      
      if (!userData) return [];
      
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:author_id (
            username,
            profile_picture
          )
        `)
        .eq('author_id', userData.id)
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
    enabled: !!id
  });

  useEffect(() => {
    if (creator?.user_id) {
      checkFollowStatus(creator.user_id).then(setIsFollowing);
    }
  }, [creator?.user_id, checkFollowStatus, setIsFollowing]);

  useEffect(() => {
    if (!id || !creator?.user_id) return;

    const creatorChannel = supabase
      .channel(`creator-${creator.user_id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'creators',
          filter: `user_id=eq.${creator.user_id}` 
        }, 
        () => {
          console.log('Creator profile changed, refreshing data');
          refetchCreator();
        }
      )
      .subscribe();

    const postsChannel = supabase
      .channel(`creator-posts-${creator.user_id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'posts',
          filter: `author_id=eq.${creator.user_id}` 
        }, 
        () => {
          console.log('Creator posts changed, refreshing data');
          refetchPosts();
        }
      )
      .subscribe();

    const tiersChannel = supabase
      .channel(`creator-tiers-${creator.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'membership_tiers',
          filter: creator.id ? `creator_id=eq.${creator.id}` : undefined
        }, 
        () => {
          console.log('Membership tiers changed, refreshing data');
          refetchCreator();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(creatorChannel);
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(tiersChannel);
    };
  }, [id, creator?.user_id, creator?.id, refetchCreator, refetchPosts]);
  
  if (isLoadingCreator || isLoadingPosts) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }
  
  if (!creator) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Creator Not Found</h2>
          <p className="text-muted-foreground mb-6">We couldn't find a creator with this username.</p>
          <Button asChild>
            <a href="/explore">Explore Creators</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const displayName = creator.fullName || creator.username || "Creator";
  const avatarUrl = creator.avatar_url || creator.profile_image_url;
  const bannerImage = creator.banner_url || "/default-banner.jpg"; // Add default banner if none exists

  const handleFollowToggle = async () => {
    if (isFollowing) {
      await unfollowCreator(creator.user_id);
    } else {
      await followCreator(creator.user_id);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
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
              
              {creator.id && (
                <div className="mt-2">
                  <SocialLinks creatorId={creator.id} />
                </div>
              )}
            </div>
            <div className="mt-4 md:mt-0 space-x-2">
              <Button>
                Message
              </Button>
              <Button
                onClick={handleFollowToggle}
                disabled={followLoading}
                variant={isFollowing ? "outline" : "default"}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="px-4">
          <p>{creator.bio || "This creator hasn't added a bio yet."}</p>
        </div>
        
        <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="pt-6">
            {posts.length > 0 ? (
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
                <p className="text-muted-foreground">No posts yet from this creator.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="membership" className="pt-6">
            <div className="text-center p-8">
              <h3 className="text-xl font-semibold mb-2">Membership Tiers</h3>
              <p className="text-muted-foreground">Join this creator's community to unlock exclusive content and perks.</p>
              {creator.tiers && creator.tiers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {creator.tiers.map(tier => (
                    <div key={tier.id} className="border rounded-lg p-4">
                      <h4 className="font-medium">{tier.name}</h4>
                      <p className="text-xl font-bold mt-1">${Number(tier.price).toFixed(2)}/mo</p>
                      <ul className="mt-3">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="text-sm text-muted-foreground">{feature}</li>
                        ))}
                      </ul>
                      <Button className="w-full mt-4">Subscribe</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4">This creator has not set up any membership tiers yet.</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="about" className="pt-6">
            <div className="max-w-3xl mx-auto prose prose-sm">
              <h3 className="text-xl font-semibold mb-4">About {displayName}</h3>
              <p className="text-muted-foreground">{creator.bio || "No information provided."}</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CreatorPage;
