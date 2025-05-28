
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

interface ExploreHeroProps {
  categoryFilter: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function ExploreHero({ categoryFilter, searchQuery, setSearchQuery }: ExploreHeroProps) {
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      console.log('Search query too short:', searchQuery);
    }
  };

  return (
    <section className="mb-10">
      <div className="relative rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-black/70 z-10" />
        <div className="w-full h-64 bg-gradient-to-r from-purple-900 to-blue-900"></div>
        <div className="absolute inset-0 z-20 flex flex-col justify-center p-8">
          <h1 className="text-4xl font-bold mb-2">
            {categoryFilter ? `Explore ${categoryFilter}` : 'Explore FanRealms'}
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mb-6">
            {categoryFilter 
              ? `Discover amazing ${categoryFilter} creators and their exclusive content`
              : 'Discover amazing creators and exclusive content across various categories'
            }
          </p>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for creators, content, or topics..."
                className="pl-10 bg-gray-900/80 border-gray-700 focus-visible:ring-purple-500 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
