
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useManualCancelSubscription } from '@/hooks/stripe/useManualCancelSubscription';

interface ManualCancelButtonProps {
  creatorId: string;
}

export function ManualCancelButton({ creatorId }: ManualCancelButtonProps) {
  const { manualCancelSubscription, isLoading } = useManualCancelSubscription();

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      manualCancelSubscription(creatorId);
    }
  };

  return (
    <Button 
      onClick={handleCancel}
      disabled={isLoading}
      variant="destructive"
      size="sm"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Canceling...
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4" />
          Force Cancel Subscription
        </>
      )}
    </Button>
  );
}
