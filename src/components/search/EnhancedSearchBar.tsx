
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCreators } from '@/hooks/useCreators';
import { AdvancedSearchModal } from './AdvancedSearchModal';

interface EnhancedSearchBarProps {
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
}

interface SearchFilters {
  followerSize: string[];
  engagementRate: string[];
  audienceDemo: string[];
  contentType: string[];
  platform: string[];
  sortBy: string;
}

// Popular suggestions for autosuggest
const popularSuggestions = [
  'photography', 'fitness', 'cooking', 'music', 'art', 'gaming',
  'tech', 'lifestyle', 'fashion', 'beauty', 'travel', 'education',
  'business', 'comedy', 'animation', 'podcast', 'writing', 'design'
];

export function EnhancedSearchBar({ 
  placeholder = "Search creators, skills, niches...", 
  className = "",
  showFilters = true 
}: EnhancedSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get real-time search results
  const { data: creators = [], isLoading } = useCreators(searchTerm);

  // Filter suggestions based on current input
  const filteredSuggestions = popularSuggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(searchTerm.toLowerCase()) &&
    searchTerm.length > 0
  ).slice(0, 5);

  // Calculate dropdown position when showing suggestions
  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // Add 8px gap between input and dropdown
        left: rect.left,
        width: rect.width
      });
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show suggestions when there's input and update position
  useEffect(() => {
    const shouldShow = searchTerm.length > 0;
    setShowSuggestions(shouldShow);
    if (shouldShow) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        updateDropdownPosition();
      }, 0);
    }
  }, [searchTerm]);

  // Update position on window resize and scroll
  useEffect(() => {
    const handleResize = () => {
      if (showSuggestions) {
        updateDropdownPosition();
      }
    };

    const handleScroll = () => {
      if (showSuggestions) {
        updateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleInputFocus = () => {
    if (searchTerm.length > 0) {
      setShowSuggestions(true);
      updateDropdownPosition();
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleCreatorSelect = (creatorId: string) => {
    const creator = creators.find(c => c.id === creatorId);
    if (creator) {
      const routeIdentifier = creator.username || creator.id;
      setShowSuggestions(false);
      setSearchTerm("");
      navigate(`/creator/${routeIdentifier}`);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const handleAdvancedSearch = (query: string, filters: SearchFilters) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.sortBy !== 'relevance') params.set('sort', filters.sortBy);
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'sortBy' && Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(','));
      }
    });

    navigate(`/search?${params.toString()}`);
  };

  return (
    <>
      <div className={`relative ${className}`} ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
            <Input
              ref={inputRef}
              placeholder={placeholder}
              className="pl-10 pr-4"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit();
                }
              }}
            />
          </div>
          
          <Button type="submit" size="sm">
            <Search className="h-4 w-4" />
          </Button>
          
          {showFilters && (
            <AdvancedSearchModal 
              onSearch={handleAdvancedSearch}
              initialQuery={searchTerm}
            />
          )}
        </form>
      </div>

      {/* Portal-style dropdown that renders outside the component hierarchy */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 1000 }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 pointer-events-auto"
            onClick={() => setShowSuggestions(false)}
          />
          
          {/* Dropdown content */}
          <Card 
            className="absolute max-h-96 overflow-y-auto shadow-xl border bg-background/95 backdrop-blur-sm pointer-events-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${Math.max(dropdownPosition.width, 300)}px`,
            }}
          >
            {isLoading ? (
              <div className="p-4 flex items-center justify-center">
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                <span>Searching...</span>
              </div>
            ) : (
              <div className="p-2">
                {/* Creator Results */}
                {creators.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                      Creators ({creators.length})
                    </div>
                    {creators.slice(0, 4).map((creator) => (
                      <div
                        key={creator.id}
                        onClick={() => handleCreatorSelect(creator.id)}
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent rounded-sm transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={creator.avatar_url || creator.profile_image_url || undefined} />
                          <AvatarFallback>
                            {(creator.display_name || creator.username || 'C')[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium text-sm truncate">
                            {creator.display_name || creator.username || 'Unknown Creator'}
                          </span>
                          {creator.username && (
                            <span className="text-xs text-muted-foreground truncate">@{creator.username}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Popular Suggestions */}
                {filteredSuggestions.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                      Popular Categories
                    </div>
                    {filteredSuggestions.map((suggestion) => (
                      <div
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent rounded-sm transition-colors"
                      >
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* No results */}
                {creators.length === 0 && filteredSuggestions.length === 0 && searchTerm.length >= 2 && (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    <div className="mb-2">No creators found for "{searchTerm}".</div>
                    <button 
                      onClick={() => handleSearchSubmit()}
                      className="text-primary hover:underline text-sm"
                    >
                      Search for "{searchTerm}" →
                    </button>
                  </div>
                )}

                {/* Minimum characters message */}
                {searchTerm.length > 0 && searchTerm.length < 2 && (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Type at least 2 characters to search...
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
