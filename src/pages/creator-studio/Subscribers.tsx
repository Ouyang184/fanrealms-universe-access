
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
import { UserCheck, Search, UserPlus, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreatorCheck } from "@/components/creator-studio/CreatorCheck";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");

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

  // Filter subscribers based on search term and tier filter
  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = searchTerm.trim() === "" || 
      subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesTier = filterTier === "all" || subscriber.tier === filterTier;
    
    return matchesSearch && matchesTier;
  });

  // Count subscribers by tier
  const tierCounts = subscribers.reduce((acc, subscriber) => {
    acc[subscriber.tier] = (acc[subscriber.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <CreatorCheck>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Subscribers</h1>
            <p className="text-muted-foreground">Manage and view insights about your subscribers</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Subscribers
            </Button>
          </div>
        </div>
        
        {/* Subscriber stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
                <h3 className="text-2xl font-bold">{subscribers.length}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Premium Subscribers</p>
                <h3 className="text-2xl font-bold">{tierCounts['Premium'] || 0}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">VIP Subscribers</p>
                <h3 className="text-2xl font-bold">{tierCounts['VIP'] || 0}</h3>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Search and Filters */}
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
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="Premium">Premium</SelectItem>
              <SelectItem value="Basic Supporter">Basic Supporter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Subscribers Table */}
        <Card>
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
        </Card>
      </div>
    </CreatorCheck>
  );
}
