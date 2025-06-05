
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubscriberWithDetails } from "@/types/creator-studio";

interface SubscriberSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterTier: string;
  setFilterTier: (tier: string) => void;
  tiers: Array<{id: string; name: string; price: number}>;
  subscribers: SubscriberWithDetails[];
}

export const SubscriberSearch: React.FC<SubscriberSearchProps> = ({
  searchTerm,
  setSearchTerm,
  filterTier,
  setFilterTier,
  tiers,
  subscribers
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Search subscribers..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={filterTier} onValueChange={setFilterTier}>
        <SelectTrigger className="w-full md:w-48">
          <SelectValue placeholder="Filter by tier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tiers</SelectItem>
          {tiers && tiers.length > 0 ? (
            tiers.map(tier => (
              <SelectItem key={tier.id} value={tier.name}>{tier.name}</SelectItem>
            ))
          ) : (
            // Fallback to unique tiers from the sample data
            [...new Set(subscribers.map(s => s.tier.title))].map(tierTitle => (
              <SelectItem key={tierTitle} value={tierTitle}>{tierTitle}</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
