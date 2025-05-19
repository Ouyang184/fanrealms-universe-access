
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter, CreditCard, Star, Clock, Video, FileIcon, Download, Heart, MoreHorizontal, ChevronRight, Users } from "lucide-react"
import { MainLayout } from "@/components/main-layout"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import { useEffect, useState } from "react"
import { EmptyFeed } from "@/components/feed/EmptyFeed"
import LoadingSpinner from "@/components/LoadingSpinner"
import { Link } from "react-router-dom"

// Sample data for recent content
const recentContent = [
  {
    id: 1,
    creator: "ArtistAlley",
    title: "Character Design Masterclass Part 3",
    type: "video",
    thumbnail: "/placeholder.svg",
    date: "2 days ago",
    tier: "Pro Artist",
  },
  {
    id: 2,
    creator: "GameDev Masters",
    title: "Creating Advanced AI Behavior Trees",
    type: "tutorial",
    thumbnail: "/placeholder.svg",
    date: "Yesterday",
    tier: "Indie Developer",
  },
  {
    id: 3,
    creator: "Music Production Hub",
    title: "May Sample Pack: Ambient Textures",
    type: "download",
    thumbnail: "/placeholder.svg",
    date: "4 hours ago",
    tier: "Producer Plus",
  },
  {
    id: 4,
    creator: "ArtistAlley",
    title: "Lighting Techniques for Digital Painting",
    type: "tutorial",
    thumbnail: "/placeholder.svg",
    date: "1 week ago",
    tier: "Pro Artist",
  },
]

// Sample data for payment history
const paymentHistory = [
  {
    id: "INV-001",
    creator: "ArtistAlley",
    amount: 15.0,
    date: "April 15, 2025",
    status: "Paid",
  },
  {
    id: "INV-002",
    creator: "GameDev Masters",
    amount: 25.0,
    date: "April 22, 2025",
    status: "Paid",
  },
  {
    id: "INV-003",
    creator: "Music Production Hub",
    amount: 10.0,
    date: "April 10, 2025",
    status: "Paid",
  },
]

// Sample data for recommended creators
const recommendedCreators = [
  {
    id: 1,
    name: "Writing Workshop",
    username: "writingworkshop",
    avatar: "/placeholder.svg",
    description: "Creative writing courses and feedback",
    subscribers: 2450,
    topTier: {
      name: "Author's Circle",
      price: 20,
    },
  },
  {
    id: 2,
    name: "Photo Masters",
    username: "photomasters",
    avatar: "/placeholder.svg",
    description: "Photography tutorials and presets",
    subscribers: 5280,
    topTier: {
      name: "Pro Photographer",
      price: 15,
    },
  },
]

// Get tier badge color
const getTierColor = (name: string | undefined) => {
  switch (name?.toLowerCase()) {
    case "pro artist":
      return "bg-primary";
    case "indie developer":
      return "bg-green-600";
    case "producer plus":
      return "bg-blue-600";
    case "author's circle":
      return "bg-amber-600";
    case "pro photographer":
      return "bg-cyan-600";
    default:
      return "bg-primary";
  }
};

export default function SubscriptionsPage() {
  const { subscriptions, loadingSubscriptions } = useSubscriptions();
  const [hasSubscriptions, setHasSubscriptions] = useState<boolean>(true);
  
  useEffect(() => {
    if (!loadingSubscriptions) {
      setHasSubscriptions(subscriptions && subscriptions.length > 0);
    }
  }, [subscriptions, loadingSubscriptions]);

  // Calculate monthly spending
  const monthlySpending = subscriptions?.reduce((total, sub) => {
    return total + (sub.tier?.price || 0);
  }, 0) || 0;

  // Find next payment date
  const today = new Date();
  let nextPaymentDate = new Date(today);
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
  const nextPayment = {
    date: nextPaymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: subscriptions?.find(s => s.tier)?.tier?.price || 0
  };

  if (loadingSubscriptions) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (!hasSubscriptions) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto w-full p-6">
          <h1 className="text-2xl font-semibold mb-6">Your Subscriptions</h1>
          <Card className="w-full p-6">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-16 w-16 mb-4 text-muted-foreground" />
              <h3 className="text-xl font-medium mb-2">No Subscriptions Found</h3>
              <p className="text-muted-foreground mb-6">
                You haven't subscribed to any creators yet.
                Start following creators to see their content here!
              </p>
              <Button asChild>
                <Link to="/explore">Explore Creators</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Your Subscriptions</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Methods
            </Button>
          </div>
        </div>

        {/* Subscription Summary */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Active Subscriptions</span>
                <div className="flex items-baseline mt-1">
                  <span className="text-3xl font-semibold">{subscriptions?.length || 0}</span>
                  <span className="text-green-500 text-sm ml-2">Active</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Monthly Spending</span>
                <div className="flex items-baseline mt-1">
                  <span className="text-3xl font-semibold">
                    ${monthlySpending.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground text-sm ml-2">per month</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Next Payment</span>
                <div className="flex items-baseline mt-1">
                  <span className="text-3xl font-semibold">{nextPayment.date}</span>
                  <span className="text-muted-foreground text-sm ml-2">
                    ${nextPayment.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="subscriptions" className="mb-8">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="subscriptions">
              Active Subscriptions
            </TabsTrigger>
            <TabsTrigger value="content">
              Recent Content
            </TabsTrigger>
            <TabsTrigger value="billing">
              Billing History
            </TabsTrigger>
          </TabsList>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {subscriptions?.map((subscription) => {
                const creator = subscription.creator;
                const tier = subscription.tier;
                
                // Format subscription date
                const createdDate = new Date(subscription.created_at);
                const memberSince = createdDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                });
                
                // Calculate next billing date (1 month from creation)
                const nextBillingDate = new Date(createdDate);
                nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
                const nextBilling = nextBillingDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                });
                
                return (
                  <Card key={subscription.id} className="overflow-hidden">
                    <div
                      className="h-32 bg-cover bg-center"
                      style={{ backgroundImage: `url(${creator?.banner_url || "/placeholder.svg"})` }}
                    />
                    <CardContent className="pt-0 -mt-12 p-6">
                      <div className="flex justify-between items-start">
                        <Avatar className="h-20 w-20 border-4 border-background">
                          <AvatarImage
                            src={creator?.profile_image_url || creator?.avatar_url || "/placeholder.svg"}
                            alt={creator?.username || "Creator"}
                          />
                          <AvatarFallback>
                            {(creator?.username || "C").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {tier && (
                          <Badge className={getTierColor(tier.name)}>
                            {tier.name || "Free"}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold mt-4">{creator?.username || "Creator"}</h3>
                      <p className="text-muted-foreground text-sm mt-1">{creator?.bio || "No bio available"}</p>

                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Membership Level</span>
                          <span className="font-medium">{tier?.name || "Free"}</span>
                        </div>
                        {tier && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Monthly Payment</span>
                            <span className="font-medium">${tier.price?.toFixed(2) || "0.00"}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Next Billing Date</span>
                          <span className="font-medium">{nextBilling}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Member Since</span>
                          <span className="font-medium">{memberSince}</span>
                        </div>
                      </div>

                      {tier && tier.description && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Tier Benefits</h4>
                          <p className="text-sm text-muted-foreground">{tier.description}</p>
                        </div>
                      )}

                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Recently updated
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>Change Tier</DropdownMenuItem>
                            <DropdownMenuItem>Message Creator</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Cancel Subscription</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 p-4 flex justify-between">
                      <Button variant="ghost" size="sm" className="text-primary">
                        View Creator Page
                      </Button>
                      <Button size="sm">
                        View Content
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Recent Content Tab */}
          <TabsContent value="content" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentContent.map((content) => (
                <Card key={content.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={content.thumbnail}
                      alt={content.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-primary">{content.tier}</Badge>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-background/70 px-2 py-1 rounded text-xs flex items-center gap-1">
                      {content.type === "video" && <Video className="h-3 w-3" />}
                      {content.type === "tutorial" && <FileIcon className="h-3 w-3" />}
                      {content.type === "download" && <Download className="h-3 w-3" />}
                      {content.type}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">{content.creator}</div>
                    <h3 className="font-semibold line-clamp-2">{content.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{content.date}</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Billing History Tab */}
          <TabsContent value="billing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Your recent subscription payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 bg-muted/50 p-4 text-sm font-medium">
                    <div>Invoice</div>
                    <div>Creator</div>
                    <div>Date</div>
                    <div>Amount</div>
                    <div>Status</div>
                  </div>
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="grid grid-cols-5 p-4 text-sm border-t">
                      <div className="font-medium">{payment.id}</div>
                      <div>{payment.creator}</div>
                      <div>{payment.date}</div>
                      <div>${payment.amount.toFixed(2)}</div>
                      <div>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" size="sm">
                  Download All Receipts
                </Button>
                <Button variant="outline" size="sm">
                  View All Transactions
                </Button>
              </CardFooter>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Upcoming Payments</CardTitle>
                <CardDescription>Your scheduled subscription renewals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptions?.map((subscription) => {
                    const creator = subscription.creator;
                    const tier = subscription.tier;
                    
                    // Calculate next billing date (1 month from creation)
                    const createdDate = new Date(subscription.created_at);
                    const nextBillingDate = new Date(createdDate);
                    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
                    const nextBilling = nextBillingDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    });
                    
                    return (
                      <div
                        key={subscription.id}
                        className="flex items-center justify-between p-4 border rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={creator?.profile_image_url || creator?.avatar_url || "/placeholder.svg"}
                              alt={creator?.username || "Creator"}
                            />
                            <AvatarFallback>{(creator?.username || "C").charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{creator?.username || "Creator"}</div>
                            <div className="text-sm text-muted-foreground">{tier?.name || "Free"}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${tier?.price?.toFixed(2) || "0.00"}</div>
                          <div className="text-sm text-muted-foreground">{nextBilling}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recommended Creators */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recommended Creators</h2>
            <Button variant="link" className="text-primary">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedCreators.map((creator) => (
              <Card key={creator.id} className="flex overflow-hidden">
                <div className="p-4 flex-shrink-0">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={creator.avatar} alt={creator.name} />
                    <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{creator.name}</h3>
                    <Badge variant="outline">
                      {creator.subscribers.toLocaleString()} subscribers
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{creator.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Top tier: </span>
                      <span className="font-medium">{creator.topTier.name}</span>
                      <span className="text-muted-foreground ml-1">${creator.topTier.price}/mo</span>
                    </div>
                    <Button size="sm">
                      View Creator
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
