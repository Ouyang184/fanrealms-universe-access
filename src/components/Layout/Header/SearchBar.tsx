
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCreators } from "@/hooks/useCreators";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

export function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Only search when there's a search term with minimum length
  const { data: creators = [], isLoading } = useCreators(searchTerm);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show dropdown when there's search term with minimum length and results
  useEffect(() => {
    setIsOpen(searchTerm.length >= 2);
  }, [searchTerm]);

  const handleCreatorSelect = (creatorId: string) => {
    const creator = creators.find(c => c.id === creatorId);
    if (!creator) {
      console.error("Creator not found with ID:", creatorId);
      toast({
        title: "Error",
        description: "Couldn't find that creator profile",
        variant: "destructive"
      });
      return;
    }
    
    // Prioritize navigation by username if available
    let routeIdentifier = creator.username || creator.id;
    
    console.log(`Header SearchBar: Navigating to creator profile for: "${routeIdentifier}" (${creator.display_name || 'No Display Name'})`);
    
    setIsOpen(false);
    setSearchTerm(""); // Clear search term after selection
    
    // Navigate to the creator profile page
    navigate(`/creator/${routeIdentifier}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative flex-1 max-w-xl" ref={searchRef}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
      <Input
        placeholder="Search for creators..."
        className="pl-10 pr-20"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded-md">⌘</kbd>
        <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded-md">K</kbd>
      </div>
      
      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 max-h-96 overflow-y-auto z-50 shadow-lg border bg-background">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
              <span>Searching...</span>
            </div>
          ) : searchTerm.length < 2 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Type at least 2 characters to search...
            </div>
          ) : creators.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No creators found for "{searchTerm}".
            </div>
          ) : (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                Creators ({creators.length})
              </div>
              {creators.map((creator) => (
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
                    <span className="font-medium text-sm truncate">{creator.display_name || creator.username || 'Unknown Creator'}</span>
                    {creator.username && (
                      <span className="text-xs text-muted-foreground truncate">@{creator.username}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
