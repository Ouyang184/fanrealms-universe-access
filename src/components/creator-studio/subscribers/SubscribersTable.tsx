
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubscriberWithDetails } from "@/types/creator-studio";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SubscribersTableProps {
  filteredSubscribers: SubscriberWithDetails[];
  formatDate: (dateString: string) => string;
  getTierBadgeVariant: (tier: string) => "default" | "secondary" | "outline";
  isLoading?: boolean;
}

export const SubscribersTable: React.FC<SubscribersTableProps> = ({ 
  filteredSubscribers,
  formatDate,
  getTierBadgeVariant,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Table>
        <TableCaption>Loading active subscribers...</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Subscriber</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Amount Paid</TableHead>
            <TableHead>Subscription Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRow key={i}>
              <TableCell className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableCaption>Active subscribers and their spending</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Subscriber</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead>Amount Paid</TableHead>
          <TableHead>Subscription Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredSubscribers.length > 0 ? (
          filteredSubscribers.map((subscriber) => (
            <TableRow key={subscriber.id}>
              <TableCell className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={subscriber.avatarUrl} />
                  <AvatarFallback>{subscriber.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{subscriber.name}</span>
              </TableCell>
              <TableCell>
                <Badge variant={getTierBadgeVariant(subscriber.tier)}>
                  {subscriber.tier}
                </Badge>
              </TableCell>
              <TableCell className="font-medium text-green-600">
                ${subscriber.tierPrice.toFixed(2)}
              </TableCell>
              <TableCell>{formatDate(subscriber.subscriptionDate)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="lucide lucide-more-horizontal"
                      >
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      Remove Subscription
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
              No active subscribers found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
