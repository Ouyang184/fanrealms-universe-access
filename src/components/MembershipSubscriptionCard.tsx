
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionEvents } from "@/hooks/useSubscriptionEvents";
import { useCreateSubscription } from "@/hooks/stripe/useCreateSubscription";
import { useNavigate } from "react-router-dom";

interface MembershipTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  subscriberCount?: number;
}

interface MembershipSubscriptionCardProps {
  tier: MembershipTier;
  creatorId: string;
  isSubscribed?: boolean;
  onSubscriptionChange?: () => void;
}

const getBadgeIcon = (tierName: string) => {
  const name = tierName.toLowerCase();
  if (name.includes('premium') || name.includes('pro')) {
    return <Star className="h-3 w-3" />;
  } else if (name.includes('plus') || name.includes('advanced')) {
    return <Zap className="h-3 w-3" />;
  }
  return <Check className="h-3 w-3" />;
};

export function MembershipSubscriptionCard({ 
  tier, 
  creatorId, 
  isSubscribed = false,
  onSubscriptionChange 
}: MembershipSubscriptionCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerSubscriptionSuccess } = useSubscriptionEvents();
  const { createSubscription, isProcessing } = useCreateSubscription();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe to this tier.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Creating subscription for tier:', tier.id, 'creator:', creatorId);
      
      const result = await createSubscription({ 
        tierId: tier.id, 
        creatorId 
      });

      if (result?.error) {
        return; // Error already handled in hook
      }

      if (result?.clientSecret) {
        // Navigate to payment page
        navigate('/payment', {
          state: {
            clientSecret: result.clientSecret,
            amount: Math.round(tier.price * 100),
            tierName: tier.name,
            tierId: tier.id,
            creatorId
          }
        });
        
        toast({
          title: "Redirecting to Payment",
          description: "Please complete your payment to activate the subscription.",
        });
      } else if (result?.subscriptionId) {
        // Subscription created successfully
        toast({
          title: "Subscription successful!",
          description: `You are now subscribed to ${tier.name}.`,
        });

        // Trigger subscription success events
        triggerSubscriptionSuccess({
          tierId: tier.id,
          creatorId,
          tierName: tier.name
        });

        // Call the callback if provided
        onSubscriptionChange?.();
      }

    } catch (error: any) {
      console.error('Subscription error:', error);
      // Error is already handled in the hook
    }
  };

  return (
    <Card className={`relative ${isSubscribed ? 'ring-2 ring-primary' : ''}`}>
      {isSubscribed && (
        <div className="absolute -top-2 -right-2">
          <Badge variant="default" className="gap-1">
            <Check className="h-3 w-3" />
            Subscribed
          </Badge>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getBadgeIcon(tier.name)}
            <CardTitle className="text-xl">{tier.name}</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${tier.price}</div>
            <div className="text-sm text-muted-foreground">/month</div>
          </div>
        </div>
        <CardDescription>{tier.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subscribers</span>
            <Badge variant="outline">{tier.subscriberCount || 0}</Badge>
          </div>
          
          <ul className="space-y-2">
            {tier.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        {isSubscribed ? (
          <Button variant="outline" className="w-full" disabled>
            Already Subscribed
          </Button>
        ) : (
          <Button 
            onClick={handleSubscribe} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? "Processing..." : `Subscribe for $${tier.price}/month`}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
