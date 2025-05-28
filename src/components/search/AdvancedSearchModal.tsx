
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Filter, Search } from 'lucide-react';

interface SearchFilters {
  followerSize: string[];
  engagementRate: string[];
  audienceDemo: string[];
  contentType: string[];
  platform: string[];
  sortBy: string;
}

interface AdvancedSearchModalProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  initialQuery?: string;
}

export function AdvancedSearchModal({ onSearch, initialQuery = '' }: AdvancedSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({
    followerSize: [],
    engagementRate: [],
    audienceDemo: [],
    contentType: [],
    platform: [],
    sortBy: 'relevance'
  });
  const [open, setOpen] = useState(false);

  const handleFilterChange = (category: keyof SearchFilters, value: string, checked: boolean) => {
    setFilters(prev => {
      if (category === 'sortBy') {
        return { ...prev, [category]: value };
      }
      
      const currentArray = prev[category] as string[];
      return {
        ...prev,
        [category]: checked 
          ? [...currentArray, value]
          : currentArray.filter(item => item !== value)
      };
    });
  };

  const handleSearch = () => {
    onSearch(searchQuery, filters);
    setOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      followerSize: [],
      engagementRate: [],
      audienceDemo: [],
      contentType: [],
      platform: [],
      sortBy: 'relevance'
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Filter className="h-4 w-4 mr-1" />
          Filters
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Search Filters</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Search Query */}
          <div>
            <Label htmlFor="search">Search Query</Label>
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for creators, skills, niches..."
              className="mt-1"
            />
          </div>

          {/* Sort By */}
          <div>
            <Label>Sort By</Label>
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value, true)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="followers">Follower Count</SelectItem>
                <SelectItem value="engagement">Engagement Rate</SelectItem>
                <SelectItem value="recent">Recent Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Follower Size */}
          <div>
            <Label className="text-sm font-medium">Follower Size</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { value: 'micro', label: 'Micro (1K–10K)' },
                { value: 'mid', label: 'Mid-tier (10K–100K)' },
                { value: 'macro', label: 'Macro (100K+)' },
                { value: 'mega', label: 'Mega (1M+)' }
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`follower-${option.value}`}
                    checked={filters.followerSize.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleFilterChange('followerSize', option.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={`follower-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Rate */}
          <div>
            <Label className="text-sm font-medium">Engagement Rate</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { value: 'low', label: 'Low (1-3%)' },
                { value: 'medium', label: 'Medium (3-5%)' },
                { value: 'high', label: 'High (5%+)' },
                { value: 'very-high', label: 'Very High (10%+)' }
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`engagement-${option.value}`}
                    checked={filters.engagementRate.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleFilterChange('engagementRate', option.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={`engagement-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Content Type */}
          <div>
            <Label className="text-sm font-medium">Content Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { value: 'video', label: 'Video' },
                { value: 'art', label: 'Visual Art' },
                { value: 'music', label: 'Music' },
                { value: 'blog', label: 'Blog/Writing' },
                { value: 'podcast', label: 'Podcast' },
                { value: 'photography', label: 'Photography' }
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`content-${option.value}`}
                    checked={filters.contentType.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleFilterChange('contentType', option.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={`content-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <Label className="text-sm font-medium">Platform Focus</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { value: 'instagram', label: 'Instagram' },
                { value: 'tiktok', label: 'TikTok' },
                { value: 'youtube', label: 'YouTube' },
                { value: 'twitter', label: 'Twitter/X' },
                { value: 'linkedin', label: 'LinkedIn' },
                { value: 'twitch', label: 'Twitch' }
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`platform-${option.value}`}
                    checked={filters.platform.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleFilterChange('platform', option.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={`platform-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
