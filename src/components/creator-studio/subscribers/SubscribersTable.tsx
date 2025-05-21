
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
}

export const SubscribersTable: React.FC<SubscribersTableProps> = ({ 
  filteredSubscribers,
  formatDate,
  getTierBadgeVariant
}) => {
  return (
    <Table>
      <TableCaption>A list of your subscribers</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Subscriber</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Tier</TableHead>
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
              <TableCell>{subscriber.email}</TableCell>
              <TableCell>
                <Badge variant={getTierBadgeVariant(subscriber.tier)}>
                  {subscriber.tier} (${subscriber.tierPrice})
                </Badge>
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
              No subscribers found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
