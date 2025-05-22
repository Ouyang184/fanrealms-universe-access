
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCreators } from "@/hooks/useCreators";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { data: creators = [], isLoading } = useCreators(searchTerm);

  // Add keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleOpenSearch = () => {
    setOpen(true);
  };

  const handleCreatorSelect = (userId: string) => {
    const creator = creators.find(c => c.user_id === userId);
    if (!creator) {
      console.error("Creator not found with ID:", userId);
      toast({
        title: "Error",
        description: "Couldn't find that creator profile",
        variant: "destructive"
      });
      return;
    }
    
    // Prioritize navigation by username if available
    const routeIdentifier = creator.username || creator.user_id;
    console.log(`Header SearchBar: Navigating to creator profile for: "${routeIdentifier}" (${creator.display_name || 'No Display Name'})`);
    
    setOpen(false);
    setSearchTerm(""); // Clear search term after selection
    
    // Navigate to the creator profile page
    navigate(`/creator/${routeIdentifier}`);
  };

  const handleSearchInput = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <div className="relative flex-1 max-w-xl">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder="Search for creators, posts, or content..."
        className="pl-10"
        onClick={handleOpenSearch}
        readOnly
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded-md">⌘</kbd>
        <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded-md">K</kbd>
      </div>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search by username or display name..."
          onValueChange={handleSearchInput}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? 
              <div className="py-6 flex items-center justify-center">
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                <span>Searching...</span>
              </div>
            : "No creators found."}
          </CommandEmpty>
          <CommandGroup heading="Creators">
            {creators.map((creator) => (
              <CommandItem
                key={creator.user_id}
                onSelect={() => handleCreatorSelect(creator.user_id)}
                className="flex items-center gap-2 p-2 cursor-pointer"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={creator.avatar_url || undefined} />
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
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
