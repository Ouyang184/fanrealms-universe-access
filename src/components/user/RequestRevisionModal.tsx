import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface RequestRevisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commissionRequest: {
    id: string;
    title: string;
    revision_count: number;
    commission_type: {
      max_revisions: number;
      price_per_revision?: number;
    };
  };
  onRevisionCreated: () => void;
}

export function RequestRevisionModal({
  open,
  onOpenChange,
  commissionRequest,
  onRevisionCreated
}: RequestRevisionModalProps) {
  const { user } = useAuth();
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isExtraRevision = commissionRequest.revision_count >= commissionRequest.commission_type.max_revisions;
  const extraRevisionFee = commissionRequest.commission_type.price_per_revision || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !revisionNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide revision notes",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-revision-payment', {
        body: {
          commissionRequestId: commissionRequest.id,
          revisionNotes: revisionNotes.trim()
        }
      });

      if (error) throw error;

      if (data.requiresPayment) {
        // Redirect to Stripe payment
        window.open(data.paymentUrl, '_blank');
        toast({
          title: "Payment Required",
          description: "Please complete the payment to submit your revision request"
        });
      } else {
        // Free revision created successfully
        toast({
          title: "Success!",
          description: "Your revision request has been submitted"
        });
        onRevisionCreated();
        onOpenChange(false);
        setRevisionNotes('');
      }
    } catch (error) {
      console.error('Error requesting revision:', error);
      toast({
        title: "Error",
        description: "Failed to submit revision request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingFreeRevisions = Math.max(0, commissionRequest.commission_type.max_revisions - commissionRequest.revision_count);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Revision</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">{commissionRequest.title}</p>
            <p>Revisions used: {commissionRequest.revision_count} of {commissionRequest.commission_type.max_revisions}</p>
            {remainingFreeRevisions > 0 ? (
              <p className="text-green-600">You have {remainingFreeRevisions} free revision{remainingFreeRevisions !== 1 ? 's' : ''} remaining</p>
            ) : (
              <p className="text-orange-600">This will be an extra revision</p>
            )}
          </div>

          {isExtraRevision && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This revision will cost an additional ${extraRevisionFee.toFixed(2)} as you've used all included revisions.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="revisionNotes">Revision Details *</Label>
              <Textarea
                id="revisionNotes"
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Please describe what changes you'd like to see..."
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isExtraRevision 
                  ? `Pay $${extraRevisionFee.toFixed(2)} & Request`
                  : 'Request Revision'
                }
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}