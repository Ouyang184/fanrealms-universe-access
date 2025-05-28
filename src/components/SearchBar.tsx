
import { EnhancedSearchBar } from '@/components/search/EnhancedSearchBar';

export function SearchBar() {
  return (
    <div className="relative w-full max-w-sm">
      <EnhancedSearchBar 
        placeholder="Search for a Creator..."
        showFilters={false}
        className="w-full"
      />
    </div>
  );
}
