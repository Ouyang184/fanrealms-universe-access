import { MainLayout } from '@/components/Layout/MainLayout';
import { useUserSubscriptions } from '@/hooks/stripe/useUserSubscriptions';
import { EmptySubscriptionsState } from '@/components/subscriptions/EmptySubscriptionsState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { SubscribedButton } from '@/components/creator/buttons/SubscribedButton';

export default function SubscriptionsPage() {
  const { userSubscriptions, subscriptionsLoading, refetchSubscriptions } = useUserSubscriptions();

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-1">Your Subscriptions</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage your active creator memberships</p>

        {subscriptionsLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : !userSubscriptions || userSubscriptions.length === 0 ? (
          <EmptySubscriptionsState
            onRefresh={refetchSubscriptions}
            isRefreshing={subscriptionsLoading}
          />
        ) : (
          <div className="space-y-4">
            {userSubscriptions.map((sub) => {
              const creatorName = sub.creators?.display_name || sub.creators?.users?.username || 'Unknown Creator';
              const creatorUsername = sub.creators?.users?.username;
              const tierTitle = sub.membership_tiers?.title || 'Membership';
              const price = sub.membership_tiers?.price ?? sub.amount / 100;
              const renewsAt = sub.current_period_end
                ? format(new Date(sub.current_period_end), 'MMM d, yyyy')
                : null;
              const isCancelling = sub.cancel_at_period_end;

              return (
                <Card key={sub.id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden border">
                          {sub.creators?.profile_image_url ? (
                            <img
                              src={sub.creators.profile_image_url}
                              alt={creatorName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">
                              {creatorName.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div>
                          {creatorUsername ? (
                            <Link
                              to={`/${creatorUsername}`}
                              className="font-semibold text-sm hover:underline"
                            >
                              {creatorName}
                            </Link>
                          ) : (
                            <p className="font-semibold text-sm">{creatorName}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">{tierTitle} · ${price}/mo</p>
                          {renewsAt && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {isCancelling
                                ? `Access until ${renewsAt}`
                                : `Renews ${renewsAt}`}
                            </p>
                          )}
                          <div className="mt-1.5 flex gap-2 flex-wrap">
                            <Badge
                              variant={isCancelling ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {isCancelling ? 'Cancels at period end' : 'Active'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <SubscribedButton
                          tierName={tierTitle}
                          subscriptionData={sub}
                          tierId={sub.tier_id}
                          creatorId={sub.creator_id}
                          onSubscriptionSuccess={refetchSubscriptions}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
