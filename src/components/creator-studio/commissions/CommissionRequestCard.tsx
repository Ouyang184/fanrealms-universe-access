
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  DollarSign, 
  User, 
  MessageCircle, 
  CheckCircle, 
  XCircle,
  Clock,
  CreditCard
} from 'lucide-react';
import { CommissionRequestStatus } from '@/types/commission';

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

interface CommissionRequestCardProps {
  request: CommissionRequestWithRelations;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onUpdateStatus: (id: string, status: CommissionRequestStatus) => void;
}

export function CommissionRequestCard({
  request,
  onAccept,
  onReject,
  onUpdateStatus
}: CommissionRequestCardProps) {
  const getStatusColor = (status: CommissionRequestStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'checkout_created':
        return 'bg-blue-100 text-blue-800';
      case 'payment_authorized':
        return 'bg-green-100 text-green-800';
      case 'payment_failed':
        return 'bg-red-100 text-red-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: CommissionRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'checkout_created':
        return <CreditCard className="h-4 w-4" />;
      case 'payment_authorized':
        return <CreditCard className="h-4 w-4" />;
      case 'payment_failed':
        return <XCircle className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: CommissionRequestStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'checkout_created':
        return 'Payment Pending';
      case 'payment_authorized':
        return 'Payment Received - Awaiting Approval';
      case 'payment_failed':
        return 'Payment Failed';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const canAcceptOrReject = request.status === 'payment_authorized' || request.status === 'pending';
  const showPaymentInfo = ['checkout_created', 'payment_authorized', 'payment_failed'].includes(request.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{request.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <User className="h-4 w-4" />
              <span>{request.customer.username}</span>
              <Calendar className="h-4 w-4 ml-2" />
              <span>{new Date(request.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <Badge className={`${getStatusColor(request.status)} flex items-center gap-1`}>
            {getStatusIcon(request.status)}
            {getStatusText(request.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Commission Type</h4>
          <p className="text-sm text-muted-foreground">{request.commission_type.name}</p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-sm text-muted-foreground">{request.description}</p>
        </div>

        {request.agreed_price && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-medium">Agreed Price: ${request.agreed_price}</span>
          </div>
        )}

        {showPaymentInfo && (
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-1 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Status
            </h4>
            {request.status === 'checkout_created' && (
              <p className="text-sm text-muted-foreground">
                Customer has started payment process but hasn't completed it yet.
              </p>
            )}
            {request.status === 'payment_authorized' && (
              <p className="text-sm text-green-700">
                ✅ Payment received successfully! You can now accept or reject this commission.
              </p>
            )}
            {request.status === 'payment_failed' && (
              <p className="text-sm text-red-700">
                ❌ Payment failed. Customer needs to try payment again.
              </p>
            )}
          </div>
        )}

        {request.customer_notes && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Customer Notes
            </h4>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              {request.customer_notes}
            </p>
          </div>
        )}

        {request.creator_notes && (
          <div>
            <h4 className="font-medium mb-2">Your Notes</h4>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              {request.creator_notes}
            </p>
          </div>
        )}

        {request.reference_images && request.reference_images.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Reference Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {request.reference_images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Reference ${index + 1}`}
                  className="w-full h-20 object-cover rounded border"
                />
              ))}
            </div>
          </div>
        )}

        {canAcceptOrReject && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => onAccept(request.id)}
              className="flex-1"
              disabled={request.status !== 'payment_authorized' && request.status !== 'pending'}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Commission
            </Button>
            <Button
              onClick={() => onReject(request.id)}
              variant="outline"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}

        {request.status === 'accepted' && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => onUpdateStatus(request.id, 'in_progress')}
              className="flex-1"
            >
              Mark as In Progress
            </Button>
          </div>
        )}

        {request.status === 'in_progress' && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => onUpdateStatus(request.id, 'completed')}
              className="flex-1"
            >
              Mark as Completed
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
