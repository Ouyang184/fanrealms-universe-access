
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useCreatorPage } from "@/hooks/useCreatorPage";
import { useFollow } from "@/hooks/useFollow";
import { CreatorHeader } from "@/components/creator/CreatorHeader";
import { CreatorPosts } from "@/components/creator/CreatorPosts";
import { CreatorMembership } from "@/components/creator/CreatorMembership";
import { CreatorAbout } from "@/components/creator/CreatorAbout";
import { toast } from "@/hooks/use-toast";

const CreatorPage: React.FC = () => {
  // Get the identifier from the URL parameter
  const { id: identifier } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log(`Creator page mounted with identifier param: "${identifier}"`);
    if (!identifier) {
      toast({
        title: "Error",
        description: "Creator identifier is missing",
        variant: "destructive"
      });
      navigate("/explore");
    }
  }, [identifier, navigate]);
  
  const {
    creator,
    posts,
    activeTab,
    setActiveTab,
    isLoadingCreator,
    isLoadingPosts,
    refreshCreatorData
  } = useCreatorPage(identifier);

  const { isFollowing, followCreator, unfollowCreator, setIsFollowing, checkFollowStatus } = useFollow();
  
  // Check follow status when creator is loaded
  useEffect(() => {
    if (creator?.id) {
      checkFollowStatus(creator.id).then(status => {
        setIsFollowing(status);
      });
    }
  }, [creator?.id, checkFollowStatus, setIsFollowing]);
  
  // Add effect to refresh data if needed
  useEffect(() => {
    if (identifier && !creator && !isLoadingCreator) {
      console.log("Creator not found, refreshing data");
      refreshCreatorData();
    }
  }, [identifier, creator, isLoadingCreator, refreshCreatorData]);
  
  const handleFollow = async () => {
    if (creator?.id) {
      await followCreator(creator.id);
    }
  };

  const handleUnfollow = async () => {
    if (creator?.id) {
      await unfollowCreator(creator.id);
    }
  };
  
  console.log('Creator Page:', { identifier, creator, isLoading: isLoadingCreator });
  
  if (isLoadingCreator) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner />
          <span className="ml-2">Loading creator profile...</span>
        </div>
      </MainLayout>
    );
  }
  
  if (!creator) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Creator Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find a creator with this identifier: {identifier}
          </p>
          <Button asChild>
            <a href="/explore">Explore Creators</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <CreatorHeader 
          creator={creator}
          isFollowing={isFollowing}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
        />
        
        {/* Content Tags Section */}
        {creator.tags && creator.tags.length > 0 && (
          <div className="px-4">
            <h3 className="text-lg font-semibold mb-3">Content Tags</h3>
            <div className="flex flex-wrap gap-2">
              {creator.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="px-3 py-1">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
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
            <CreatorPosts posts={posts || []} />
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
