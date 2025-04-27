
import { MainLayout } from "@/components/Layout/MainLayout";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

type Subscription = {
  id: number;
  creatorName: string;
  creatorAvatar?: string;
  planName: string;
  amount: number;
  currency: string;
  renewalDate: string;
  status: "active" | "expiring" | "canceled";
};

type Purchase = {
  id: number;
  itemName: string;
  creatorName: string;
  creatorAvatar?: string;
  amount: number;
  currency: string;
  purchaseDate: string;
  downloadAvailable: boolean;
};

const subscriptionSamples: Subscription[] = [
  {
    id: 1,
    creatorName: "Creative Studio",
    creatorAvatar: "https://picsum.photos/seed/avatar1/100/100",
    planName: "Pro Membership",
    amount: 9.99,
    currency: "USD",
    renewalDate: "May 15, 2025",
    status: "active"
  },
  {
    id: 2,
    creatorName: "Animation Pro",
    creatorAvatar: "https://picsum.photos/seed/avatar3/100/100",
    planName: "Premium Access",
    amount: 14.99,
    currency: "USD",
    renewalDate: "May 22, 2025",
    status: "active"
  },
  {
    id: 3,
    creatorName: "Content Masters",
    creatorAvatar: "https://picsum.photos/seed/avatar2/100/100",
    planName: "Inner Circle",
    amount: 19.99,
    currency: "USD",
    renewalDate: "May 2, 2025",
    status: "expiring"
  },
];

const purchaseSamples: Purchase[] = [
  {
    id: 1,
    itemName: "Digital Art Masterclass",
    creatorName: "Creative Studio",
    creatorAvatar: "https://picsum.photos/seed/avatar1/100/100",
    amount: 29.99,
    currency: "USD",
    purchaseDate: "April 22, 2025",
    downloadAvailable: true
  },
  {
    id: 2,
    itemName: "Character Animation Bundle",
    creatorName: "Animation Pro",
    creatorAvatar: "https://picsum.photos/seed/avatar3/100/100",
    amount: 49.99,
    currency: "USD",
    purchaseDate: "April 10, 2025",
    downloadAvailable: true
  },
  {
    id: 3,
    itemName: "Content Creator Toolkit",
    creatorName: "Content Masters",
    creatorAvatar: "https://picsum.photos/seed/avatar2/100/100",
    amount: 19.99,
    currency: "USD",
    purchaseDate: "March 25, 2025",
    downloadAvailable: true
  },
];

function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const getStatusColor = (status: Subscription['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'expiring': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'canceled': return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
      default: return '';
    }
  };
  
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={subscription.creatorAvatar} alt={subscription.creatorName} />
              <AvatarFallback>{subscription.creatorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{subscription.creatorName}</CardTitle>
              <CardDescription>{subscription.planName}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(subscription.status)}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Next payment</span>
          <span className="font-medium">{subscription.renewalDate}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-medium">
            {subscription.currency} {subscription.amount.toFixed(2)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" size="sm" className="w-full">Manage Subscription</Button>
      </CardFooter>
    </Card>
  );
}

function PurchaseCard({ purchase }: { purchase: Purchase }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={purchase.creatorAvatar} alt={purchase.creatorName} />
            <AvatarFallback>{purchase.creatorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{purchase.itemName}</CardTitle>
            <CardDescription>{purchase.creatorName}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Purchase date</span>
          <span className="font-medium">{purchase.purchaseDate}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-medium">
            {purchase.currency} {purchase.amount.toFixed(2)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {purchase.downloadAvailable && (
          <Button size="sm" className="w-full">Download</Button>
        )}
      </CardFooter>
    </Card>
  );
}

function SubscriptionSkeleton() {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}

export default function Purchases() {
  const { isChecking } = useAuthCheck();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isChecking) return;
    
    const timer = setTimeout(() => {
      setSubscriptions(subscriptionSamples);
      setPurchases(purchaseSamples);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isChecking]);
  
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Purchases</h1>
          <p className="text-muted-foreground">Manage your subscriptions and purchases</p>
        </div>
        
        <Tabs defaultValue="subscriptions" className="w-full">
          <TabsList>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="purchases">One-time Purchases</TabsTrigger>
          </TabsList>
          <div className="mt-6">
            <TabsContent value="subscriptions" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  <>
                    <SubscriptionSkeleton />
                    <SubscriptionSkeleton />
                    <SubscriptionSkeleton />
                  </>
                ) : subscriptions.length > 0 ? (
                  subscriptions.map((subscription) => (
                    <SubscriptionCard key={subscription.id} subscription={subscription} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">No active subscriptions.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="purchases" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  <>
                    <SubscriptionSkeleton />
                    <SubscriptionSkeleton />
                    <SubscriptionSkeleton />
                  </>
                ) : purchases.length > 0 ? (
                  purchases.map((purchase) => (
                    <PurchaseCard key={purchase.id} purchase={purchase} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">No purchases found.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
