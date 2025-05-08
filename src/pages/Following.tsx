
import { NewMainLayout } from "@/components/Layout/NewMainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";

export default function FollowingPage() {
  const { profile } = useAuth();
  const { data: followedCreators, isLoading } = useFollow(profile?.id);

  return (
    <NewMainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Following</h1>
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <div className="w-full h-24 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-full h-24 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-full h-24 bg-muted rounded-lg animate-pulse"></div>
          </div>
        ) : followedCreators && followedCreators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followedCreators.map((creator) => (
              <div key={creator.id} className="border border-border rounded-lg p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  {creator.username?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{creator.username || "Creator"}</h3>
                  <p className="text-muted-foreground text-sm">
                    {creator.bio?.substring(0, 100) || "No bio available"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 border border-dashed border-border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">You aren't following any creators yet</h3>
            <p className="text-muted-foreground mb-6">
              Follow some creators to see their content in your feed.
            </p>
          </div>
        )}
      </div>
    </NewMainLayout>
  );
}
