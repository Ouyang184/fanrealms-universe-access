
import { useEffect, useState } from "react";
import { useFollow } from "../hooks/useFollow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreators } from "../hooks/useCreators";
import CreatorProfileCard from "@/components/CreatorProfileCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { CreatorProfile } from "@/types";

export default function FollowingPage() {
  const { isLoading } = useFollow();
  const { data: creators = [] } = useCreators();
  const { subscriptions } = useSubscriptions();
  const [followedCreators, setFollowedCreators] = useState<CreatorProfile[]>([]);
  
  // Get list of followed creators using subscription data and creators list
  useEffect(() => {
    if (!subscriptions || !creators.length) return;
    
    const followedCreatorIds = subscriptions.map(sub => sub.creator_id);
    const followedCreatorsList = creators.filter(creator => 
      followedCreatorIds.includes(creator.id)
    );
    
    setFollowedCreators(followedCreatorsList);
  }, [subscriptions, creators]);
  
  // Get popular creators (not followed)
  const popularCreators = creators
    .filter(creator => !followedCreators.some(fc => fc.id === creator.id))
    .slice(0, 6);

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Following</h1>
      <p className="text-muted-foreground mb-6">Manage your followed creators</p>

      <Tabs defaultValue="all">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[280px] rounded-lg bg-muted animate-pulse" />
              ))
            ) : followedCreators?.length ? (
              followedCreators.map((creator) => (
                <CreatorProfileCard key={creator.id} creator={creator} />
              ))
            ) : (
              <div className="col-span-full py-8 text-center">
                <p className="text-xl font-medium mb-2">You're not following anyone yet</p>
                <p className="text-muted-foreground mb-6">
                  Follow creators to see their content in your feed
                </p>

                <h3 className="text-lg font-semibold mb-4">Popular creators to follow</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularCreators.slice(0, 6).map((creator) => (
                    <CreatorProfileCard key={creator.id} creator={creator} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followedCreators
              ?.sort((a, b) => {
                const subA = subscriptions?.find(sub => sub.creator_id === a.id);
                const subB = subscriptions?.find(sub => sub.creator_id === b.id);
                return new Date(subB?.created_at || 0).getTime() - 
                       new Date(subA?.created_at || 0).getTime();
              })
              .slice(0, 6)
              .map((creator) => (
                <CreatorProfileCard key={creator.id} creator={creator} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followedCreators
              ?.filter((creator) => {
                const sub = subscriptions?.find(sub => sub.creator_id === creator.id);
                return sub?.is_paid;
              })
              .map((creator) => (
                <CreatorProfileCard key={creator.id} creator={creator} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
