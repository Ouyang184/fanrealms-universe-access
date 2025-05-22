
import React from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useCreatorPage } from "@/hooks/useCreatorPage";
import { CreatorHeader } from "@/components/creator/CreatorHeader";
import { CreatorPosts } from "@/components/creator/CreatorPosts";
import { CreatorMembership } from "@/components/creator/CreatorMembership";
import { CreatorAbout } from "@/components/creator/CreatorAbout";

const CreatorPage: React.FC = () => {
  // Get the username from the URL parameter
  const { id: username } = useParams<{ id: string }>();
  const {
    creator,
    posts,
    activeTab,
    setActiveTab,
    isLoadingCreator,
    isLoadingPosts,
    isFollowing,
    followLoading,
    handleFollowToggle
  } = useCreatorPage(username);
  
  console.log('Creator Page:', { username, creator });
  
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
          <p className="text-muted-foreground mb-6">We couldn't find a creator with this username: {username}</p>
          <Button asChild>
            <a href="/explore">Explore Creators</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Ensure we use display_name if available, otherwise fall back to username
  const displayName = creator.display_name || creator.username;

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <CreatorHeader 
          creator={{...creator, displayName}}
          isFollowing={isFollowing}
          followLoading={followLoading}
          onFollowToggle={handleFollowToggle}
        />
        
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
            <CreatorPosts posts={posts} />
          </TabsContent>
          
          <TabsContent value="membership" className="pt-6">
            <CreatorMembership creator={creator} />
          </TabsContent>
          
          <TabsContent value="about" className="pt-6">
            <CreatorAbout creator={creator} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CreatorPage;
