
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: creators = [], isLoading } = useCreators();

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

  const handleCreatorSelect = (displayName: string) => {
    setOpen(false);
    navigate(`/creator/${displayName}`);
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline-block">Search</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
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
