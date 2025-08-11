
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileUpload } from './FileUpload';
import { useCommissionDeliverables } from '@/hooks/useCommissionDeliverables';
import { CommissionRequest } from '@/types/commission';

interface SubmitWorkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: CommissionRequest & {
    commission_type: { name: string; base_price: number };
    customer: { username: string; profile_picture?: string };
  };
}

export function SubmitWorkModal({ open, onOpenChange, request }: SubmitWorkModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const { createDeliverable, isSubmitting, uploadFile } = useCommissionDeliverables();
  const [externalLinksText, setExternalLinksText] = useState('');
  const parsedExternalLinks = externalLinksText
    .split(/\n|,/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((link) => {
      try {
        const u = new URL(link);
        return u.protocol === 'https:' || u.protocol === 'http:';
      } catch {
        return false;
      }
    });

  const handleSubmit = async () => {
    if (selectedFiles.length === 0 && parsedExternalLinks.length === 0) {
      return;
    }

    try {
      let fileUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map((file) => uploadFile(file, request.id));
        fileUrls = await Promise.all(uploadPromises);
      }

      createDeliverable({
        commissionRequestId: request.id,
        fileUrls,
        deliveryNotes: deliveryNotes || undefined,
        externalLinks: parsedExternalLinks,
      });

      setSelectedFiles([]);
      setDeliveryNotes('');
      setExternalLinksText('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting work:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Commission Work</DialogTitle>
          <DialogDescription>
            Submit your completed work for "{request.title}" by @{request.customer.username}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Commission Files *</Label>
            <FileUpload 
              onFilesChange={setSelectedFiles}
              maxFiles={10}
              maxSizePerFile={50}
            />
            {(selectedFiles.length === 0 && parsedExternalLinks.length === 0) && (
              <p className="text-sm text-red-600">Please upload at least one file or add at least one link</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="external-links">External download links (Optional)</Label>
            <Textarea
              id="external-links"
              placeholder="Paste Google Drive, Mega, Dropbox, or other download links here. One per line or comma-separated."
              value={externalLinksText}
              onChange={(e) => setExternalLinksText(e.target.value)}
              className="min-h-[80px]"
            />
            {externalLinksText && parsedExternalLinks.length === 0 && (
              <p className="text-sm text-red-600">Please enter valid http(s) links</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery-notes">Delivery Notes (Optional)</Label>
            <Textarea
              id="delivery-notes"
              placeholder="Add any notes or instructions for the customer about your work..."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• The customer will be notified of your delivery</li>
              <li>• They can download and review your work</li>
              <li>• The commission status will be updated to "Delivered"</li>
              <li>• You can still submit additional files if needed</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || (selectedFiles.length === 0 && parsedExternalLinks.length === 0)}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Work'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
