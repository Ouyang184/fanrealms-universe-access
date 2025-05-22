
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
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

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: creators = [] } = useCreators();

  const handleOpenSearch = () => {
    setOpen(true);
  };

  const handleCreatorSelect = (username: string) => {
    setOpen(false);
    navigate(`/creator/${username}`);
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
        <CommandInput placeholder="Search for creators..." />
        <CommandList>
          <CommandEmpty>No creators found.</CommandEmpty>
          <CommandGroup heading="Creators">
            {creators.map((creator) => (
              <CommandItem
                key={creator.id}
                onSelect={() => handleCreatorSelect(creator.username || '')}
                className="flex items-center gap-2 p-2 cursor-pointer"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={creator.avatar_url || undefined} />
                  <AvatarFallback>
                    {(creator.display_name || creator.username || 'C')[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{creator.display_name || creator.username || 'Unknown Creator'}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
