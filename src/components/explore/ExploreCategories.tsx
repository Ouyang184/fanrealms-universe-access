
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { CategoryGrid } from "@/components/onboarding/CategoryGrid";

export function ExploreCategories() {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Browse Categories</h2>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Use the CategoryGrid component */}
      <CategoryGrid 
        selectedCategories={[]} 
        onToggle={() => {}} 
        linkToCategory={true} 
      />
    </section>
  );
}
