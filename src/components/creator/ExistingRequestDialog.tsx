import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Clock } from 'lucide-react';
import { ExistingCommissionCheck } from '@/hooks/useExistingCommissionCheck';
import { useNavigate } from 'react-router-dom';

interface ExistingRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkResult: ExistingCommissionCheck;
  onCreateNew: () => void;
  onResumeRequest?: () => void;
}

export function ExistingRequestDialog({
  open,
  onOpenChange,
  checkResult,
  onCreateNew,
  onResumeRequest
}: ExistingRequestDialogProps) {
  const navigate = useNavigate();
  const { existingRequest, actionType, message } = checkResult;

  const handleGoToPayment = () => {
    if (existingRequest) {
      onOpenChange(false);
      navigate(`/commissions/${existingRequest.id}/pay`);
    }
  };

  const handleViewRequest = () => {
    if (existingRequest) {
      onOpenChange(false);
      navigate(`/commissions/${existingRequest.id}`);
    }
  };

  const handleCreateNew = () => {
    onOpenChange(false);
    onCreateNew();
  };

  const handleResume = () => {
    onOpenChange(false);
    if (onResumeRequest) {
      onResumeRequest();
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'payment_pending': return 'text-orange-600';
      case 'payment_failed': return 'text-red-600';
      case 'accepted': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Existing Commission Request</DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>

        {existingRequest && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{existingRequest.commission_type.name}</h4>
                <span className={`text-sm font-medium ${getStatusColor(existingRequest.status)}`}>
                  {formatStatus(existingRequest.status)}
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>${existingRequest.agreed_price || existingRequest.commission_type.base_price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(existingRequest.created_at).toLocaleDateString()}</span>
                </div>
                {existingRequest.deadline && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Deadline: {new Date(existingRequest.deadline).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {actionType === 'payment' && (
                <Button onClick={handleGoToPayment} className="w-full">
                  Complete Payment
                </Button>
              )}
              
              {actionType === 'resume' && (
                <Button onClick={handleViewRequest} className="w-full">
                  View Request
                </Button>
              )}
              
              {(actionType === 'resume' || actionType === 'payment') && (
                <Button variant="outline" onClick={handleCreateNew} className="w-full">
                  Create New Request Instead
                </Button>
              )}
              
              {actionType === 'warning' && (
                <>
                  <Button onClick={handleViewRequest} variant="outline" className="w-full">
                    View Existing Request
                  </Button>
                  <Button onClick={handleCreateNew} className="w-full">
                    Create New Request Anyway
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}