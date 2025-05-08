
import { useState } from "react";
import { NewMainLayout } from "@/components/Layout/NewMainLayout";
import { PostsSection } from "@/components/dashboard/PostsSection";
import { usePosts } from "@/hooks/usePosts";
import { useProfile } from "@/hooks/useProfile";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("feed");
  const { profile, isLoading: profileLoading } = useProfile();
  const { posts, isLoading: postsLoading } = usePosts();
  
  const isLoading = profileLoading || postsLoading;
  const isCreator = !!profile?.creator_profile_id;
  
  return (
    <NewMainLayout>
      <div className="container mx-auto py-6">
        <PostsSection 
          posts={posts} 
          isLoading={isLoading} 
          isCreator={isCreator}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </NewMainLayout>
  );
}
