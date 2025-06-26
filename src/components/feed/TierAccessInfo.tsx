
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Star, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { Link } from 'react-router-dom';

interface TierAccessInfoProps {
  tierId: string;
  creatorId?: string;
  className?: string;
}

export function TierAccessInfo({ tierId, creatorId, className }: TierAccessInfoProps) {
  const { user } = useAuth();
  
  // Fetch tier information
  const { data: tierInfo, isLoading: tierLoading } = useQuery({
    queryKey: ['tier-info', tierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('id', tierId as any)
        .single();
      
      if (error) {
        console.error('Error fetching tier info:', error);
        return null;
      }
      
      return data as any;
    },
    enabled: !!tierId
  });

  // Fetch creator information if creatorId is provided
  const { data: creatorInfo, isLoading: creatorLoading } = useQuery({
    queryKey: ['creator-info-for-tier', creatorId],
    queryFn: async () => {
      if (!creatorId) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('id', creatorId as any)
        .single();
      
      if (error) {
        console.error('Error fetching creator info:', error);
        return null;
      }
      
      return data as any;
    },
    enabled: !!creatorId
  });

  // Check subscription status
  const { data: subscriptionStatus } = useSubscriptionCheck(user?.id, tierId);

  if (tierLoading || creatorLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tierInfo) {
    return null;
  }

  const isSubscribed = subscriptionStatus?.isSubscribed;
  const monthlyPrice = (tierInfo as any)?.price ? Number((tierInfo as any).price) : 0;
  const yearlyPrice = monthlyPrice * 12 * 0.9; // 10% discount for yearly

  return (
    <Card className={`border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Premium Content</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            <Star className="h-3 w-3 mr-1" />
            {(tierInfo as any)?.title || 'Premium'}
          </Badge>
        </div>
        <CardDescription>
          This content is exclusive to {(tierInfo as any)?.title || 'premium'} subscribers
          {creatorInfo && ` of ${(creatorInfo as any)?.display_name || 'this creator'}`}.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isSubscribed ? (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="font-medium">Monthly Subscription</p>
                  <p className="text-sm text-muted-foreground">Billed monthly</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">${monthlyPrice.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">/month</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                <div>
                  <p className="font-medium text-green-800">Yearly Subscription</p>
                  <p className="text-sm text-green-600">Save 10% annually</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-800">${yearlyPrice.toFixed(2)}</p>
                  <p className="text-sm text-green-600">/year</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                asChild 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Link to={`/subscribe/${(tierInfo as any)?.id}/${(creatorInfo as any)?.id || creatorId}`}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscribe Now
                </Link>
              </Button>
              
              {creatorInfo && (
                <Button variant="outline" asChild className="w-full">
                  <Link to={`/creator/${(creatorInfo as any)?.id}`}>
                    View Creator Profile
                  </Link>
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 font-medium">🎉 You have access to this content!</p>
            <p className="text-sm text-green-600 mt-1">
              Thanks for being a {(tierInfo as any)?.title} subscriber!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
