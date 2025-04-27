
import { useState } from "react";
import { Card } from "@/components/ui/card";
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
import { SubscriberWithDetails } from "@/types/creator-studio";

export default function CreatorStudioSubscribers() {
  const [subscribers, setSubscribers] = useState<SubscriberWithDetails[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      tier: 'Premium',
      tierPrice: 15,
      subscriptionDate: '2025-03-15T10:30:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=1'
    },
    {
      id: '2',
      name: 'Jamie Smith',
      email: 'jamie.smith@example.com',
      tier: 'VIP',
      tierPrice: 30,
      subscriptionDate: '2025-03-20T14:15:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=2'
    },
    {
      id: '3',
      name: 'Taylor Wilson',
      email: 'taylor.w@example.com',
      tier: 'Basic Supporter',
      tierPrice: 5,
      subscriptionDate: '2025-03-22T09:45:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=3'
    },
    {
      id: '4',
      name: 'Jordan Lee',
      email: 'j.lee@example.com',
      tier: 'Premium',
      tierPrice: 15,
      subscriptionDate: '2025-03-25T16:20:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=4'
    },
    {
      id: '5',
      name: 'Casey Rivera',
      email: 'c.rivera@example.com',
      tier: 'Basic Supporter',
      tierPrice: 5,
      subscriptionDate: '2025-04-01T11:10:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=5'
    },
  ]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getTierBadgeVariant(tier: string) {
    switch(tier) {
      case 'VIP': return 'default';
      case 'Premium': return 'secondary';
      default: return 'outline';
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Subscribers</h1>
      
      <Card>
        <Table>
          <TableCaption>A list of your subscribers</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Subscriber</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Subscription Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.length > 0 ? (
              subscribers.map((subscriber) => (
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
                      {subscriber.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(subscriber.subscriptionDate)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No subscribers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
