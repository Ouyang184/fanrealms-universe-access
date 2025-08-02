import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FilterOptions {
  status: string;
  priceRange: { min: number; max: number };
  sortBy: string;
  sortOrder: string;
}

interface FilterModalProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  activeFiltersCount: number;
}

export function FilterModal({ filters, onFiltersChange, activeFiltersCount }: FilterModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    const resetFilters: FilterOptions = {
      status: "all",
      priceRange: { min: 0, max: 1000 },
      sortBy: "created_at",
      sortOrder: "desc"
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    setIsOpen(false);
  };

  const isFiltered = localFilters.status !== "all" || 
    localFilters.priceRange.min > 0 || 
    localFilters.priceRange.max < 1000 ||
    localFilters.sortBy !== "created_at" ||
    localFilters.sortOrder !== "desc";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <Filter className="h-4 w-4" />
          Filter
          {activeFiltersCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Subscriptions
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={localFilters.status}
              onValueChange={(value) => setLocalFilters({ ...localFilters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <Label>Price Range (per month)</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor="minPrice" className="text-xs text-muted-foreground">Min ($)</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="0"
                  value={localFilters.priceRange.min || ""}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    priceRange: { ...localFilters.priceRange, min: Number(e.target.value) || 0 }
                  })}
                />
              </div>
              <span className="text-muted-foreground mt-5">to</span>
              <div className="flex-1">
                <Label htmlFor="maxPrice" className="text-xs text-muted-foreground">Max ($)</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="1000"
                  value={localFilters.priceRange.max || ""}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    priceRange: { ...localFilters.priceRange, max: Number(e.target.value) || 1000 }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <div className="flex gap-2">
              <Select
                value={localFilters.sortBy}
                onValueChange={(value) => setLocalFilters({ ...localFilters, sortBy: value })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="amount">Price</SelectItem>
                  <SelectItem value="creator_name">Creator Name</SelectItem>
                  <SelectItem value="next_billing">Next Billing</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={localFilters.sortOrder}
                onValueChange={(value) => setLocalFilters({ ...localFilters, sortOrder: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleApplyFilters} className="flex-1">
              Apply Filters
            </Button>
            {isFiltered && (
              <Button onClick={handleResetFilters} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}