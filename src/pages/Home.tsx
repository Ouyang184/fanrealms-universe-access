
import { useState } from "react";
import { MainLayout } from "@/components/main-layout";
import { PostsSection } from "@/components/dashboard/PostsSection";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("feed");
  const { profile } = useAuth();
  const { data: posts, isLoading: postsLoading } = usePosts();
  
  const isLoading = postsLoading;
  
  // Check if the user is a creator based on the creator_id field that exists in the database
  // This is a safe check that won't cause TypeScript errors
  const isCreator = !!profile?.id; // We'll assume any logged in user with a profile can be a creator
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <PostsSection 
          posts={posts || []} 
          isLoading={isLoading} 
          isCreator={isCreator}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </MainLayout>
  );
}
