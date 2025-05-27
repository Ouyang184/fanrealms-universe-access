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
import { Filter, CreditCard, Clock, MoreHorizontal, ChevronRight, Users } from "lucide-react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { useStripeSubscription } from "@/hooks/useStripeSubscription"
import { useEffect, useState } from "react"
import LoadingSpinner from "@/components/LoadingSpinner"
import { Link } from "react-router-dom"

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
  const { userSubscriptions, subscriptionsLoading, cancelSubscription } = useStripeSubscription();
  const [hasSubscriptions, setHasSubscriptions] = useState<boolean>(true);
  
  useEffect(() => {
    if (!subscriptionsLoading) {
      setHasSubscriptions(userSubscriptions && userSubscriptions.length > 0);
    }
  }, [userSubscriptions, subscriptionsLoading]);

  // Calculate monthly spending
  const monthlySpending = userSubscriptions?.reduce((total, sub) => {
    return total + (sub.tier?.price || 0);
  }, 0) || 0;

  // Find next payment date
  const today = new Date();
  let nextPaymentDate = new Date(today);
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
  const nextPayment = {
    date: nextPaymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: userSubscriptions?.find(s => s.tier)?.tier?.price || 0
  };

  if (subscriptionsLoading) {
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
                  <span className="text-3xl font-semibold">{userSubscriptions?.length || 0}</span>
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
            <TabsTrigger value="billing">
              Billing History
            </TabsTrigger>
          </TabsList>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userSubscriptions?.map((subscription) => {
                const creator = subscription.creator;
                const tier = subscription.tier;
                const user = creator?.users;
                
                // Format subscription date
                const createdDate = new Date(subscription.created_at);
                const memberSince = createdDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                });
                
                // Calculate next billing date based on current period end
                const nextBillingDate = subscription.current_period_end ? 
                  new Date(subscription.current_period_end) : 
                  new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000); // fallback to 30 days from creation
                
                const nextBilling = nextBillingDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                });
                
                return (
                  <Card key={subscription.id} className="overflow-hidden">
                    <div
                      className="h-32 bg-cover bg-center"
                      style={{ backgroundImage: `url(${creator?.banner_url || creator?.profile_image_url || "/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png"})` }}
                    />
                    <CardContent className="pt-0 -mt-12 p-6">
                      <div className="flex justify-between items-start">
                        <Avatar className="h-20 w-20 border-4 border-background">
                          <AvatarImage
                            src={creator?.profile_image_url || user?.profile_picture || "/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png"}
                            alt={user?.username || "Creator"}
                          />
                          <AvatarFallback>
                            {(creator?.display_name || user?.username || "C").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {tier && (
                          <Badge className={getTierColor(tier.title)}>
                            {tier.title || "Free"}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold mt-4">
                        {creator?.display_name || user?.username || "Creator"}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">{creator?.bio || "No bio available"}</p>

                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Membership Level</span>
                          <span className="font-medium">{tier?.title || "Free"}</span>
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
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <span className="font-medium capitalize">{subscription.status}</span>
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
                            Updated {new Date(subscription.updated_at || subscription.created_at).toLocaleDateString()}
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
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => cancelSubscription(subscription.id)}
                            >
                              Cancel Subscription
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 p-4 flex justify-between">
                      <Button variant="ghost" size="sm" className="text-primary" asChild>
                        <Link to={`/creator/${subscription.creator_id}`}>View Creator Page</Link>
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

          {/* Billing History Tab */}
          <TabsContent value="billing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Payments</CardTitle>
                <CardDescription>Your scheduled subscription renewals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userSubscriptions?.map((subscription) => {
                    const creator = subscription.creator;
                    const tier = subscription.tier;
                    const user = creator?.users;
                    
                    // Calculate next billing date based on current period end
                    const nextBillingDate = subscription.current_period_end ? 
                      new Date(subscription.current_period_end) : 
                      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    
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
                              src={creator?.profile_image_url || user?.profile_picture || "/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png"}
                              alt={user?.username || "Creator"}
                            />
                            <AvatarFallback>
                              {(creator?.display_name || user?.username || "C").charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {creator?.display_name || user?.username || "Creator"}
                            </div>
                            <div className="text-sm text-muted-foreground">{tier?.title || "Free"}</div>
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
      </div>
    </MainLayout>
  )
}
