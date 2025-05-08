
import { useState } from "react";
import { PostsSection } from "@/components/dashboard/PostsSection";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { SingleSidebarLayout } from "@/components/Layout/SingleSidebarLayout";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("feed");
  const { profile } = useAuth();
  const { data: posts, isLoading: postsLoading } = usePosts();
  
  const isLoading = postsLoading;
  
  // Check if the user is a creator based on the ID field
  const isCreator = !!profile?.id;
  
  return (
    <SingleSidebarLayout>
      <div className="container mx-auto">
        <PostsSection 
          posts={posts || []} 
          isLoading={isLoading} 
          isCreator={isCreator}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </SingleSidebarLayout>
  );
}
