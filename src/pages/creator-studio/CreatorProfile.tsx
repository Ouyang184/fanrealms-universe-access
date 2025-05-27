
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ProfileHeader } from "@/components/creator-studio/profile/ProfileHeader";
import { ProfileStatistics } from "@/components/creator-studio/profile/ProfileStatistics";
import { ProfilePostsTab } from "@/components/creator-studio/profile/ProfilePostsTab";
import { ProfileMembershipTab } from "@/components/creator-studio/profile/ProfileMembershipTab";
import { useCreatorProfileData } from "@/hooks/useCreatorProfileData";

export default function CreatorProfile() {
  const [activeTab, setActiveTab] = useState("posts");
  
  const {
    creator,
    posts,
    tiers,
    isLoadingCreator,
    isLoadingPosts,
    isLoadingTiers
  } = useCreatorProfileData();

  if (isLoadingCreator || !creator) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-0 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Creator Profile Preview</h1>
        <Button asChild variant="outline">
          <Link to={`/creator/${creator.username}`}>
            View Public Profile
          </Link>
        </Button>
      </div>

      {/* Use the same header component structure as public profile */}
      <ProfileHeader creator={creator} />
        
      {/* Tab Navigation - properly spaced below header */}
      <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-6 py-4">
          <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 max-w-md mx-auto h-11">
              <TabsTrigger value="posts" className="text-sm font-medium">Your Posts</TabsTrigger>
              <TabsTrigger value="membership" className="text-sm font-medium">Membership Tiers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="pt-6 px-0">
              <div className="px-6">
                <ProfileStatistics 
                  postCount={posts.length} 
                  tierCount={tiers.length} 
                  followerCount={creator.follower_count || 0}
                />
                <div className="mt-6">
                  <ProfilePostsTab posts={posts} isLoading={isLoadingPosts} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="membership" className="pt-6 px-0">
              <div className="px-6">
                <ProfileMembershipTab tiers={tiers} isLoading={isLoadingTiers} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
