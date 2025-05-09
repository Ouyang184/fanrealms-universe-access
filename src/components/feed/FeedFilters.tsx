
import React from "react";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const FeedFilters: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>All Content</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Videos</DropdownMenuItem>
          <DropdownMenuItem>Tutorials</DropdownMenuItem>
          <DropdownMenuItem>Downloads</DropdownMenuItem>
          <DropdownMenuItem>Posts</DropdownMenuItem>
          <DropdownMenuItem>Events</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Free Content Only</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
