
import { EnhancedSearchBar } from "@/components/search/EnhancedSearchBar";

interface ExploreHeroProps {
  categoryFilter: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function ExploreHero({ categoryFilter, searchQuery, setSearchQuery }: ExploreHeroProps) {
  return (
    <section className="mb-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">
        {categoryFilter ? `Explore ${categoryFilter}` : 'Explore'}
      </h1>
      <p className="text-muted-foreground mb-6 max-w-xl">
        {categoryFilter 
          ? `Discover ${categoryFilter} creators and their work`
          : 'Discover creators and content across the platform'
        }
      </p>
      <div className="max-w-xl">
        <EnhancedSearchBar 
          placeholder="Search creators, content, or topics..."
          showFilters={true}
          className="w-full"
        />
      </div>
    </section>
  );
}
