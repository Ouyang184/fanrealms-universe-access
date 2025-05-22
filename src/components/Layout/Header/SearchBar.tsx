
import { Search } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: creators = [] } = useCreators();

  // Handle keyboard shortcut
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

  const handleCreatorSelect = (username: string) => {
    setOpen(false);
    navigate(`/creator/${username}`);
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline-block">Search</span>
            <div className="hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded-md">⌘</kbd>
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded-md">K</kbd>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            <Search className="mr-2 h-4 w-4" />
            <span>Search creators</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search for creators..." />
        <CommandList>
          <CommandEmpty>No creators found.</CommandEmpty>
          <CommandGroup heading="Creators">
            {creators.map((creator) => (
              <CommandItem
                key={creator.id}
                onSelect={() => handleCreatorSelect(creator.display_name || '')}
                className="flex items-center gap-2 p-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={creator.avatar_url || undefined} />
                  <AvatarFallback>
                    {(creator.display_name || 'C')[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{creator.display_name || 'Unknown Creator'}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
