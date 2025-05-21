
import { useState, useEffect } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function CreatorStudioSubscribers() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [subscribers, setSubscribers] = useState<SubscriberWithDetails[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      tier: 'Supporter Tier',
      tierPrice: 15,
      subscriptionDate: '2025-03-15T10:30:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=1'
    },
    {
      id: '2',
      name: 'Jamie Smith',
      email: 'jamie.smith@example.com',
      tier: 'Exclusive Tier',
      tierPrice: 30,
      subscriptionDate: '2025-03-20T14:15:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=2'
    },
    {
      id: '3',
      name: 'Taylor Wilson',
      email: 'taylor.w@example.com',
      tier: 'Basic Tier',
      tierPrice: 5,
      subscriptionDate: '2025-03-22T09:45:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=3'
    },
    {
      id: '4',
      name: 'Jordan Lee',
      email: 'j.lee@example.com',
      tier: 'Supporter Tier',
      tierPrice: 15,
      subscriptionDate: '2025-03-25T16:20:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=4'
    },
    {
      id: '5',
      name: 'Casey Rivera',
      email: 'c.rivera@example.com',
      tier: 'Basic Tier',
      tierPrice: 5,
      subscriptionDate: '2025-04-01T11:10:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=5'
    },
  ]);

  // Fetch creator tiers
  const { data: tiers = [] } = useQuery({
    queryKey: ["subscriber-tiers"],
    queryFn: async () => {
      if (!user) return [];
      
      // First get the creator ID
      const { data: creatorData, error: creatorError } = await supabase
        .from("creators")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (creatorError) {
        console.error("Could not find creator profile:", creatorError);
        return [];
      }
      
      // Then get the tiers for this creator
      const { data, error } = await supabase
        .from("membership_tiers")
        .select("*")
        .eq("creator_id", creatorData.id)
        .order("price", { ascending: true });
      
      if (error) {
        console.error("Error fetching tiers:", error);
        return [];
      }
      
      return data.map(tier => ({
        id: tier.id,
        name: tier.title,
        price: tier.price
      }));
    },
    enabled: !!user
  });

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getTierBadgeVariant(tier: string) {
    const tierLower = tier.toLowerCase();
    if (tierLower.includes('exclusive')) return 'default';
    if (tierLower.includes('supporter')) return 'secondary';
    return 'outline';
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

  // Helper function to get tier color classes
  const getTierColorClasses = (index: number) => {
    const colorClasses = [
      "bg-primary/10 text-primary",
      "bg-secondary/20 text-secondary-foreground",
      "bg-purple-500/10 text-purple-500",
      "bg-blue-500/10 text-blue-500",
      "bg-amber-500/10 text-amber-500"
    ];
    return colorClasses[index % colorClasses.length];
  };

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
          {/* Total Subscribers Card */}
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
          
          {/* Dynamic Tier Cards - Show top 2 tiers or fewer if not enough tiers */}
          {tiers && tiers.length > 0 ? (
            // If we have actual tiers from the database
            tiers.slice(0, 2).map((tier, index) => (
              <Card key={tier.id} className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getTierColorClasses(index)}`}>
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{tier.name} Subscribers</p>
                    <h3 className="text-2xl font-bold">{tierCounts[tier.name] || 0}</h3>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            // Fallback to show the most populated tiers from sample data
            Object.entries(tierCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 2)
              .map(([tierName, count], index) => (
                <Card key={tierName} className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getTierColorClasses(index + 1)}`}>
                      <UserCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{tierName} Subscribers</p>
                      <h3 className="text-2xl font-bold">{count}</h3>
                    </div>
                  </div>
                </Card>
              ))
          )}
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
              {tiers && tiers.length > 0 ? (
                tiers.map(tier => (
                  <SelectItem key={tier.id} value={tier.name}>{tier.name}</SelectItem>
                ))
              ) : (
                // Fallback to unique tiers from the sample data
                [...new Set(subscribers.map(s => s.tier))].map(tier => (
                  <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                ))
              )}
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
