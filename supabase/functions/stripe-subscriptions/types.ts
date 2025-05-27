
export interface CreateSubscriptionRequest {
  action: 'create_subscription';
  tierId?: string;
  tier_id?: string;
  creatorId?: string;
  creator_id?: string;
}

export interface CancelSubscriptionRequest {
  action: 'cancel_subscription';
  subscriptionId: string;
}

export type SubscriptionRequest = CreateSubscriptionRequest | CancelSubscriptionRequest;

export interface SubscriptionResponse {
  subscriptionId?: string;
  clientSecret?: string;
  success?: boolean;
  error?: string;
}
