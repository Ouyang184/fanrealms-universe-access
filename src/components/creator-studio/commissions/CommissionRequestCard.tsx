
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Check, 
  X, 
  Clock, 
  DollarSign, 
  User, 
  MessageSquare, 
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { CommissionRequestStatus } from '@/types/commission';
import { useCommissionActions } from '@/hooks/useCommissionActions';
import { SubmitWorkModal } from '@/components/creator-studio/commissions/SubmitWorkModal';

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
  const [refundReason, setRefundReason] = useState('');
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showSubmitWorkModal, setShowSubmitWorkModal] = useState(false);
  
  const { acceptCommission, rejectCommission, processRefund, isProcessing } = useCommissionActions();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'payment_pending':
        return 'bg-blue-500';
      case 'accepted':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'refunded':
        return 'bg-orange-500';
      case 'in_progress':
        return 'bg-purple-500';
      case 'completed':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'payment_pending':
        return 'Awaiting Payment';
      case 'in_progress':
        return 'In Progress';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleAccept = () => {
    acceptCommission(request.id);
  };

  const handleReject = () => {
    rejectCommission(request.id);
  };

  const handleRefund = () => {
    processRefund(request.id, refundReason);
    setShowRefundDialog(false);
    setRefundReason('');
  };

  const canAcceptOrReject = request.status === 'payment_pending';
  const canRefund = ['accepted', 'in_progress'].includes(request.status) && request.stripe_payment_intent_id;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-lg">{request.title}</CardTitle>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {request.customer.username}
              </span>
              <Badge className={getStatusColor(request.status)}>
                {getStatusText(request.status)}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-lg font-semibold">
              <DollarSign className="h-4 w-4" />
              ${request.agreed_price?.toFixed(2) || request.commission_type.base_price.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              {request.commission_type.name}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Description:</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {request.description}
          </p>
        </div>

        {request.customer_notes && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Customer Notes:
            </h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {request.customer_notes}
            </p>
          </div>
        )}

        {request.reference_images && request.reference_images.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Reference Images:</h4>
            <div className="flex gap-2 flex-wrap">
              {request.reference_images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Reference ${index + 1}`}
                  className="w-20 h-20 object-cover rounded border"
                />
              ))}
            </div>
          </div>
        )}

        {request.deadline && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Deadline: {new Date(request.deadline).toLocaleDateString()}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          {canAcceptOrReject && (
            <>
              <Button 
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Accept & Capture Payment
              </Button>
              <Button 
                onClick={handleReject}
                disabled={isProcessing}
                variant="destructive"
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Reject & Refund
              </Button>
            </>
          )}

          {canRefund && (
            <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Issue Refund
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Issue Manual Refund
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This will refund ${request.agreed_price?.toFixed(2)} to the customer 
                    and mark the commission as refunded.
                  </p>
                  <div>
                    <label className="text-sm font-medium">Reason for refund (optional):</label>
                    <Textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Enter reason for refund..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRefund}
                      disabled={isProcessing}
                      variant="destructive"
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Confirm Refund
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowRefundDialog(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {['accepted','in_progress'].includes(request.status) && (
            <>
              <Button 
                onClick={() => setShowSubmitWorkModal(true)}
                className="flex-1"
              >
                Submit Work
              </Button>
              <SubmitWorkModal 
                open={showSubmitWorkModal}
                onOpenChange={setShowSubmitWorkModal}
                request={request as any}
              />
            </>
          )}

          {request.status === 'pending' && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Waiting for customer to complete payment
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
