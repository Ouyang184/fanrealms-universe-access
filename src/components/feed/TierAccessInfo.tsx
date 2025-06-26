
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Lock, Users } from 'lucide-react';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { SubscribeButton } from '@/components/creator/SubscribeButton';
import { useAuth } from '@/contexts/AuthContext';

interface TierAccessInfoProps {
  tierId: string;
  tierName: string;
  tierPrice: number;
  creatorId: string;
  creatorName?: string;
  totalPosts: number;
  accessiblePosts: number;
}

export function TierAccessInfo({ 
  tierId, 
  tierName, 
  tierPrice, 
  creatorId, 
  creatorName = 'Creator',
  totalPosts,
  accessiblePosts
}: TierAccessInfoProps) {
  const { user } = useAuth();
  const { subscriptionData, isLoading } = useSubscriptionCheck(creatorId, tierId);
  
  const restrictedPosts = totalPosts - accessiblePosts;
  const hasAccess = subscriptionData?.isSubscribed || false;

  if (isLoading) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-orange-200 rounded w-3/4"></div>
            <div className="h-3 bg-orange-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasAccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Crown className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-green-800">
                  {tierName} Member
                </h3>
                <span className="px-2 py-1 bg-green-200 text-green-700 text-xs rounded-full font-medium">
                  Active
                </span>
              </div>
              <p className="text-sm text-green-700 mb-3">
                You have full access to all {totalPosts} posts from {creatorName} in this tier.
              </p>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Users className="h-4 w-4" />
                <span>Premium content unlocked</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-100 rounded-full">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-800 mb-2">
              {tierName} - Premium Content
            </h3>
            
            <div className="space-y-3 mb-4">
              <p className="text-sm text-orange-700">
                You're viewing {accessiblePosts} out of {totalPosts} posts. 
                {restrictedPosts > 0 && (
                  <span className="font-medium"> {restrictedPosts} premium posts are locked.</span>
                )}
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-orange-600">
                  Unlock all content for ${tierPrice}/month
                </span>
              </div>
            </div>

            {user ? (
              <SubscribeButton
                tierId={tierId}
                creatorId={creatorId}
                tierName={tierName}
                price={tierPrice}
                isSubscribed={subscriptionData?.isSubscribed || false}
                subscriptionData={subscriptionData}
              />
            ) : (
              <div className="p-3 bg-orange-100 rounded-lg">
                <p className="text-sm text-orange-700 text-center">
                  Please sign in to subscribe and unlock all content
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
