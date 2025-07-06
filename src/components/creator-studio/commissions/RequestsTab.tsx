
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Inbox } from 'lucide-react';
import { CommissionRequestCard } from './CommissionRequestCard';
import { CommissionRequestStatus } from '@/types/commission';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CommissionRequestWithRelations {
  id: string;
  commission_type_id: string;
  customer_id: string;
  creator_id: string;
  title: string;
  description: string;
  reference_images: string[];
  budget_range_min?: number;
  budget_range_max?: number;
  agreed_price?: number;
  status: CommissionRequestStatus;
  deadline?: string;
  customer_notes?: string;
  creator_notes?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  commission_type: {
    name: string;
    base_price: number;
  };
  customer: {
    username: string;
    profile_picture?: string;
  };
}

interface RequestsTabProps {
  requests: CommissionRequestWithRelations[];
  isLoading: boolean;
  pendingRequests: number;
  onAcceptRequest: (id: string) => void;
  onRejectRequest: (id: string) => void;
  onCreatePayment: (id: string) => void;
  onUpdateStatus: (id: string, status: CommissionRequestStatus) => void;
}

export function RequestsTab({
  requests,
  isLoading,
  pendingRequests,
  onAcceptRequest,
  onRejectRequest,
  onCreatePayment,
  onUpdateStatus
}: RequestsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          Commission Requests
          {pendingRequests > 0 && (
            <Badge className="bg-red-500">{pendingRequests} pending</Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage incoming commission requests from customers
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Requests Yet</h3>
            <p className="text-muted-foreground">
              Commission requests will appear here once customers start booking
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <CommissionRequestCard
                key={request.id}
                request={request}
                onAccept={onAcceptRequest}
                onReject={onRejectRequest}
                onCreatePayment={onCreatePayment}
                onUpdateStatus={onUpdateStatus}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
