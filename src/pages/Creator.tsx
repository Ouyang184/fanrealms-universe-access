
import React, { useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ArrowLeft } from "lucide-react";
import { useCreatorPage } from "@/hooks/useCreatorPage";
import { useFollow } from "@/hooks/useFollow";
import { CreatorHeader } from "@/components/creator/CreatorHeader";
import { CreatorPosts } from "@/components/creator/CreatorPosts";
import { CreatorMembership } from "@/components/creator/CreatorMembership";
import { CreatorAbout } from "@/components/creator/CreatorAbout";
import { CreatorCommissions } from "@/components/creator/CreatorCommissions";
import { CreatorRatings } from "@/components/ratings/CreatorRatings";
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
    if (tabParam && ['posts', 'membership', 'commissions', 'about', 'ratings'].includes(tabParam)) {
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
    setTimeout(() => {
      const tabsElement = document.querySelector('[role="tablist"]');
      if (tabsElement) {
        tabsElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/explore");
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
      <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="pt-2">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </div>
        
        <CreatorHeader 
          creator={creator}
          isFollowing={isFollowing}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          onNavigateToAbout={handleNavigateToAbout}
          optimisticFollowerCount={optimisticFollowerCount}
        />
        
        {/* Tab Navigation - properly spaced below header */}
        <div className="border-t border-b border-border bg-background sticky top-0 z-20 shadow-sm">
          <div className="px-3 py-2 sm:px-6 sm:py-4">
            <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex w-full max-w-full sm:mx-auto h-10 sm:h-11 gap-1.5 sm:gap-2 overflow-x-auto overscroll-x-contain -mx-3 sm:mx-0 px-3 sm:px-0 snap-x snap-mandatory">
                <TabsTrigger value="posts" className="text-sm font-medium px-3 sm:px-4 whitespace-nowrap shrink-0 snap-start">Posts</TabsTrigger>
                <TabsTrigger value="membership" className="text-sm font-medium px-3 sm:px-4 whitespace-nowrap shrink-0 snap-start">Membership</TabsTrigger>
                <TabsTrigger value="commissions" className="text-sm font-medium px-3 sm:px-4 whitespace-nowrap shrink-0 snap-start">Commissions</TabsTrigger>
                <TabsTrigger value="ratings" className="text-sm font-medium px-3 sm:px-4 whitespace-nowrap shrink-0 snap-start">Ratings</TabsTrigger>
                <TabsTrigger value="about" className="text-sm font-medium px-3 sm:px-4 whitespace-nowrap shrink-0 snap-start">About</TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts" className="pt-4 sm:pt-6 px-0">
                <div className="px-3 sm:px-6 w-full overflow-hidden [&_img]:max-w-full [&_img]:h-auto [&_video]:w-full [&_video]:h-auto [&_iframe]:w-full [&_iframe]:aspect-video">
                  <CreatorPosts posts={posts || []} />
                </div>
              </TabsContent>
              
              <TabsContent value="membership" className="pt-4 sm:pt-6 px-0">
                <div className="px-3 sm:px-6 w-full overflow-hidden [&_img]:max-w-full [&_img]:h-auto [&_video]:w-full [&_video]:h-auto [&_iframe]:w-full [&_iframe]:aspect-video">
                  <CreatorMembership creatorId={creator?.id || ''} />
                </div>
              </TabsContent>
              
              <TabsContent value="commissions" className="pt-4 sm:pt-6 px-0">
                <div className="px-3 sm:px-6 w-full overflow-hidden [&_img]:max-w-full [&_img]:h-auto [&_video]:w-full [&_video]:h-auto [&_iframe]:w-full [&_iframe]:aspect-video">
                  <CreatorCommissions creator={creator} />
                </div>
              </TabsContent>
              
              <TabsContent value="ratings" className="pt-4 sm:pt-6 px-0">
                <div className="px-3 sm:px-6 w-full overflow-hidden [&_img]:max-w-full [&_img]:h-auto [&_video]:w-full [&_video]:h-auto [&_iframe]:w-full [&_iframe]:aspect-video">
                  <CreatorRatings 
                    creatorId={creator?.id || ''} 
                    creatorName={creator?.display_name || 'this creator'} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="about" className="pt-4 sm:pt-6 px-0">
                <div className="px-3 sm:px-6 w-full overflow-hidden [&_img]:max-w-full [&_img]:h-auto [&_video]:w-full [&_video]:h-auto [&_iframe]:w-full [&_iframe]:aspect-video">
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
