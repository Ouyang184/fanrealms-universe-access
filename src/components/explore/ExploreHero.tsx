
import { EnhancedSearchBar } from "@/components/search/EnhancedSearchBar";

interface ExploreHeroProps {
  categoryFilter: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function ExploreHero({ categoryFilter, searchQuery, setSearchQuery }: ExploreHeroProps) {
  return (
    <section className="mb-8 sm:mb-10">
      <div className="relative rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-black/70 z-10" />
        <div className="w-full h-48 sm:h-64 bg-gradient-to-r from-purple-900 to-blue-900"></div>
        <div className="absolute inset-0 z-20 flex flex-col justify-center p-4 sm:p-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 leading-tight">
            {categoryFilter ? `Explore ${categoryFilter}` : 'Explore FanRealms'}
          </h1>
          <p className="text-sm sm:text-xl text-gray-200 max-w-2xl mb-4 sm:mb-6 leading-relaxed">
            {categoryFilter 
              ? `Discover amazing ${categoryFilter} creators and their exclusive content`
              : 'Discover amazing creators and exclusive content across various categories'
            }
          </p>
          <div className="max-w-2xl w-full">
            <EnhancedSearchBar 
              placeholder="Search for creators, content, or topics..."
              showFilters={true}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
