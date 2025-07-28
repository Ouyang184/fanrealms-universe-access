import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search, Hash, Filter } from 'lucide-react';
import { usePopularTags } from '@/hooks/useTags';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
}

export function TagFilter({ selectedTags, onTagsChange, className = "" }: TagFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: popularTags = [] } = usePopularTags(30);

  // Filter popular tags based on search and exclude already selected
  const filteredTags = popularTags.filter(tag => 
    tag.toLowerCase().includes(searchQuery.toLowerCase()) && 
    !selectedTags.includes(tag)
  );

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  return (
    <div className={className}>
      {/* Desktop View */}
      <div className="hidden md:block space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="h-4 w-4" />
          <span className="font-medium">Filter by Tags</span>
          {selectedTags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllTags}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTags.map(tag => (
              <Badge 
                key={tag}
                variant="default"
                className="bg-primary text-primary-foreground"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-primary-foreground/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Popular Tags */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Popular tags:</p>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {filteredTags.slice(0, 20).map(tag => (
              <Badge 
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onClick={() => addTag(tag)}
              >
                <Hash className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile View - Sheet */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Tags
              {selectedTags.length > 0 && (
                <Badge className="ml-2 h-5 min-w-[20px] text-xs">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Filter by Tags
              </SheetTitle>
              <SheetDescription>
                Select tags to filter content
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-4">
              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Selected ({selectedTags.length})</span>
                    <Button variant="ghost" size="sm" onClick={clearAllTags}>
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <Badge 
                        key={tag}
                        variant="default"
                        className="bg-primary text-primary-foreground"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-primary-foreground/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Popular Tags */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Popular tags:</p>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {filteredTags.map(tag => (
                    <Badge 
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                      onClick={() => addTag(tag)}
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}