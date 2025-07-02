
import React, { useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useCreatorPage } from "@/hooks/useCreatorPage";
import { useFollow } from "@/hooks/useFollow";
import { CreatorHeader } from "@/components/creator/CreatorHeader";
import { CreatorPosts } from "@/components/creator/CreatorPosts";
import { CreatorMembership } from "@/components/creator/CreatorMembership";
import { CreatorAbout } from "@/components/creator/CreatorAbout";
import { CreatorCommissions } from "@/components/creator/CreatorCommissions";
import { toast } from "@/hooks/use-toast";

const CreatorPage: React.FC = () => {
  // Get the identifier from the URL parameter
  const { id: identifier } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
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

  // Check for tab query parameter and set active tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['posts', 'membership', 'about', 'commissions'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, setActiveTab]);

  const { 
    isFollowing, 
    followCreator, 
    unfollowCreator, 
    setIsFollowing, 
    checkFollowStatus,
    optimisticFollowerCount 
  } = useFollow();
  
  // Check follow status when creator is loaded
  useEffect(() => {
    if (creator?.id) {
      checkFollowStatus(creator.id).then(status => {
        console.log("Setting follow status to:", status);
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
      console.log("Follow button clicked");
      await followCreator(creator.id);
    }
  };

  const handleUnfollow = async () => {
    if (creator?.id) {
      console.log("Unfollow button clicked");
      await unfollowCreator(creator.id);
    }
  };

  const handleNavigateToAbout = () => {
    setActiveTab("about");
    // Scroll to the tabs section after a short delay to ensure the tab content is rendered
    setTimeout(() => {
      const tabsElement = document.querySelector('[role="tablist"]');
      if (tabsElement) {
        tabsElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
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
      <div className="space-y-0 max-w-5xl mx-auto">
        <CreatorHeader 
          creator={creator}
          isFollowing={isFollowing}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          onNavigateToAbout={handleNavigateToAbout}
          optimisticFollowerCount={optimisticFollowerCount}
        />
        
        {/* Tab Navigation - properly spaced below header */}
        <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="px-6 py-4">
            <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 max-w-2xl mx-auto h-11">
                <TabsTrigger value="posts" className="text-sm font-medium">Posts</TabsTrigger>
                <TabsTrigger value="membership" className="text-sm font-medium">Membership</TabsTrigger>
                <TabsTrigger value="commissions" className="text-sm font-medium">Commissions</TabsTrigger>
                <TabsTrigger value="about" className="text-sm font-medium">About</TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts" className="pt-6 px-0">
                <div className="px-6">
                  <CreatorPosts posts={posts || []} />
                </div>
              </TabsContent>
              
              <TabsContent value="membership" className="pt-6 px-0">
                <div className="px-6">
                  <CreatorMembership creatorId={creator?.id || ''} />
                </div>
              </TabsContent>
              
              <TabsContent value="commissions" className="pt-6 px-0">
                <div className="px-6">
                  <CreatorCommissions creatorId={creator?.id || ''} />
                </div>
              </TabsContent>
              
              <TabsContent value="about" className="pt-6 px-0">
                <div className="px-6">
                  <CreatorAbout creator={creator} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreatorPage;
