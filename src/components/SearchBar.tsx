
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useCreators } from '@/hooks/useCreators';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  
  // Only search when there's a search term
  const { data: creators = [], isLoading } = useCreators(searchTerm);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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
    
    console.log(`Navigating to creator profile for: "${routeIdentifier}" (${creator.display_name || 'No Display Name'})`);
    
    setOpen(false);
    setSearchTerm(""); // Clear search term
    navigate(`/creator/${routeIdentifier}`);
  };

  const handleSearchInput = (value: string) => {
    setSearchTerm(value);
  };

  const handleSearchSubmit = () => {
    if (searchTerm.trim().length >= 2) {
      setOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="relative w-full max-w-sm">
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search for a Creator...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search by username or display name..." 
          onValueChange={handleSearchInput}
          value={searchTerm}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchTerm.trim().length >= 2) {
              handleSearchSubmit();
            }
          }}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? 
              <div className="py-6 flex items-center justify-center">
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                <span>Searching...</span>
              </div>
            : searchTerm.length === 0 ? "Start typing to search for creators..." : (
              <div className="py-6 text-center">
                <div className="mb-2">No creators found.</div>
                {searchTerm.length >= 2 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleSearchSubmit}
                    className="text-primary hover:text-primary/80"
                  >
                    Search for "{searchTerm}" →
                  </Button>
                )}
              </div>
            )}
          </CommandEmpty>
          {searchTerm.length > 0 && (
            <CommandGroup heading="Creators">
              {creators.slice(0, 8).map((creator) => (
                <CommandItem
                  key={creator.id}
                  onSelect={() => handleCreatorSelect(creator.id)}
                  className="flex items-center gap-2 p-2 cursor-pointer"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={creator.avatar_url || creator.profile_image_url || undefined} />
                    <AvatarFallback>
                      {(creator.display_name || creator.username || 'C')[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{creator.display_name || creator.username || 'Unknown Creator'}</span>
                    {creator.username && (
                      <span className="text-xs text-muted-foreground">@{creator.username}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
              {creators.length > 8 && (
                <CommandItem onSelect={handleSearchSubmit} className="justify-center text-primary">
                  View all {creators.length} results →
                </CommandItem>
              )}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
