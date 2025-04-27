
import React, { useState } from 'react';
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

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: creators = [], isLoading } = useCreators();

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

  const handleCreatorSelect = (username: string) => {
    setOpen(false);
    navigate(`/creator/${username}`);
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
        <CommandInput placeholder="Search for a Creator..." />
        <CommandList>
          <CommandEmpty>No creators found.</CommandEmpty>
          <CommandGroup heading="Creators">
            {creators.map((creator) => (
              <CommandItem
                key={creator.id}
                onSelect={() => handleCreatorSelect(creator.username || '')}
                className="flex items-center gap-2 p-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={creator.avatar_url || undefined} />
                  <AvatarFallback>
                    {creator.username?.[0]?.toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
                <span>{creator.username || 'Unknown Creator'}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
