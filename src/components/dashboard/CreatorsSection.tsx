
import { Card, CardContent } from "@/components/ui/card";
import CreatorProfileCard from "@/components/CreatorProfileCard";
import { usePopularCreators } from "@/hooks/usePopularCreators";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CreatorsSection() {
  const { 
    data: popularCreators = [], 
    isLoading 
  } = usePopularCreators();

  if (isLoading) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-4">Popular Creators</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <CreatorProfileCard key={n} creator={{}} isLoading={true} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Popular Creators</h2>
      {popularCreators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {popularCreators.map((creator) => (
            <CreatorProfileCard key={creator.id} creator={creator} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative w-24 h-24 mb-4 text-muted-foreground">
              <img
                src="/placeholder.svg"
                alt="No creators"
                className="w-full h-full opacity-50"
              />
            </div>
            <p className="text-lg font-medium mb-2">No Creators Found</p>
            <p className="text-muted-foreground mb-6">
              Be the first to start creating content on FanRealms!
            </p>
            <Button asChild>
              <Link to="/settings">Become a Creator</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
