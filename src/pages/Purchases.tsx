import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuthCheck } from '@/lib/hooks/useAuthCheck';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Skeleton } from '@/components/ui/skeleton';

// Sample data for purchases
const purchaseSampleData = {
  subscriptions: [
    {
      id: 1,
      name: "Creative Studio Premium",
      creator: "Creative Studio",
      price: "$10.00",
      billingCycle: "monthly",
      nextBilling: "May 15, 2025",
      image: "https://picsum.photos/seed/sub1/100/100"
    },
    {
      id: 2,
      name: "Animation Pro Plus",
      creator: "Animation Pro",
      price: "$25.00",
      billingCycle: "monthly",
      nextBilling: "May 7, 2025",
      image: "https://picsum.photos/seed/sub2/100/100"
    }
  ],
  purchases: [
    {
      id: 101,
      name: "Digital Art Masterclass",
      creator: "Creative Studio",
      price: "$45.00",
      purchaseDate: "April 12, 2025",
      image: "https://picsum.photos/seed/pur1/100/100"
    },
    {
      id: 102,
      name: "Game Development Guide",
      creator: "Game Dev",
      price: "$35.00",
      purchaseDate: "March 28, 2025",
      image: "https://picsum.photos/seed/pur2/100/100"
    },
    {
      id: 103,
      name: "Content Creation Toolkit",
      creator: "Content Masters",
      price: "$20.00",
      purchaseDate: "February 15, 2025",
      image: "https://picsum.photos/seed/pur3/100/100"
    }
  ]
};

function SubscriptionCard({ subscription }: { subscription: typeof purchaseSampleData.subscriptions[0] }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-0 flex-row gap-4 items-center">
        <div className="h-12 w-12 rounded-md overflow-hidden">
          <img src={subscription.image} alt={subscription.name} className="h-full w-full object-cover" />
        </div>
        <div>
          <CardTitle className="text-base">{subscription.name}</CardTitle>
          <CardDescription>{subscription.creator}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">{subscription.price} / {subscription.billingCycle}</p>
            <p className="text-xs text-muted-foreground">Next billing: {subscription.nextBilling}</p>
          </div>
          <Button variant="outline" size="sm">Manage</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PurchaseCard({ purchase }: { purchase: typeof purchaseSampleData.purchases[0] }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-0 flex-row gap-4 items-center">
        <div className="h-12 w-12 rounded-md overflow-hidden">
          <img src={purchase.image} alt={purchase.name} className="h-full w-full object-cover" />
        </div>
        <div>
          <CardTitle className="text-base">{purchase.name}</CardTitle>
          <CardDescription>{purchase.creator}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">{purchase.price}</p>
            <p className="text-xs text-muted-foreground">Purchased: {purchase.purchaseDate}</p>
          </div>
          <Button variant="outline" size="sm">View</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionSkeleton() {
  return (
    <Card>
      <CardHeader className="p-4 pb-0 flex-row gap-4 items-center">
        <Skeleton className="h-12 w-12 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Purchases() {
  const { isChecking } = useAuthCheck();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [data, setData] = useState(purchaseSampleData);
  
  useEffect(() => {
    if (isChecking) return;
    
    // Simulate loading data
    const timer = setTimeout(() => {
      setData(purchaseSampleData);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Your Purchases</h1>
          <p className="text-muted-foreground">Manage your subscriptions and purchases</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="purchases">One-time Purchases</TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscriptions" className="mt-0 space-y-4">
            {loading ? (
              <>
                <SubscriptionSkeleton />
                <SubscriptionSkeleton />
              </>
            ) : data.subscriptions.length > 0 ? (
              data.subscriptions.map(subscription => (
                <SubscriptionCard key={subscription.id} subscription={subscription} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">You don't have any active subscriptions.</p>
                  <Button>Explore Creators</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="purchases" className="mt-0 space-y-4">
            {loading ? (
              <>
                <SubscriptionSkeleton />
                <SubscriptionSkeleton />
                <SubscriptionSkeleton />
              </>
            ) : data.purchases.length > 0 ? (
              data.purchases.map(purchase => (
                <PurchaseCard key={purchase.id} purchase={purchase} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">You haven't made any purchases yet.</p>
                  <Button>Explore Content</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
