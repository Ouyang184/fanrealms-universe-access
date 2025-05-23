
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ProfileHeader } from "@/components/creator-studio/profile/ProfileHeader";
import { ProfileStatistics } from "@/components/creator-studio/profile/ProfileStatistics";
import { ProfilePostsTab } from "@/components/creator-studio/profile/ProfilePostsTab";
import { ProfileMembershipTab } from "@/components/creator-studio/profile/ProfileMembershipTab";
import { ProfileAboutSection } from "@/components/creator-studio/profile/ProfileAboutSection";
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
        <ProfileHeader creator={creator} />
        
        <ProfileStatistics 
          postCount={posts.length} 
          tierCount={tiers.length} 
        />
        
        <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="posts">Your Posts</TabsTrigger>
            <TabsTrigger value="membership">Membership Tiers</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="pt-6">
            <ProfilePostsTab posts={posts} isLoading={isLoadingPosts} />
          </TabsContent>
          
          <TabsContent value="membership" className="pt-6">
            <ProfileMembershipTab tiers={tiers} isLoading={isLoadingTiers} />
          </TabsContent>
          
          <TabsContent value="about" className="pt-6">
            <ProfileAboutSection creator={creator} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
