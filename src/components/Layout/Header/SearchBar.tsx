
import { EnhancedSearchBar } from "@/components/search/EnhancedSearchBar";

export function SearchBar() {
  return (
    <div className="flex-1 max-w-xl">
      <EnhancedSearchBar 
        placeholder="Search for creators..."
        showFilters={false}
        className="w-full"
      />
    </div>
  );
}
