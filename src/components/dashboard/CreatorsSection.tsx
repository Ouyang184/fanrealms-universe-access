
import { Card, CardContent } from "@/components/ui/card";
import CreatorProfileCard from "@/components/CreatorProfileCard";
import { usePopularCreators } from "@/hooks/usePopularCreators";

export function CreatorsSection() {
  const { 
    data: popularCreators = [], 
    isLoading: loadingCreators 
  } = usePopularCreators();

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
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No creators found.</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
