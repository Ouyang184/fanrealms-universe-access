import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign } from 'lucide-react';

interface CommissionType {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  price_per_character?: number;
  price_per_revision?: number;
  estimated_turnaround_days: number;
  max_revisions: number;
  dos: string[];
  donts: string[];
  sample_art_url?: string;
  is_active: boolean;
  created_at: string;
}

interface CommissionPreviewModalProps {
  commissionType: CommissionType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommissionPreviewModal({
  commissionType,
  open,
  onOpenChange,
}: CommissionPreviewModalProps) {
  if (!commissionType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {commissionType.name}
            <Badge variant={commissionType.is_active ? "default" : "secondary"}>
              {commissionType.is_active ? "Active" : "Inactive"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          {commissionType.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{commissionType.description}</p>
            </div>
          )}

          {/* Sample Art */}
          {commissionType.sample_art_url && (
            <div>
              <h3 className="font-semibold mb-2">Sample Art</h3>
              <img
                src={commissionType.sample_art_url}
                alt={`Sample art for ${commissionType.name}`}
                className="w-full max-w-md h-48 object-cover rounded-lg border"
              />
            </div>
          )}

          {/* Pricing Details */}
          <div>
            <h3 className="font-semibold mb-4">Pricing & Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium">Base Price: ${commissionType.base_price}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Turnaround: {commissionType.estimated_turnaround_days} days</span>
              </div>
              <div>
                <span className="font-medium">Max Revisions:</span> {commissionType.max_revisions}
              </div>
              {commissionType.price_per_revision && (
                <div>
                  <span className="font-medium">Extra Revision:</span> +${commissionType.price_per_revision}
                </div>
              )}
              {commissionType.price_per_character && (
                <div className="col-span-2">
                  <span className="font-medium">Price per Character:</span> +${commissionType.price_per_character}
                </div>
              )}
            </div>
          </div>

          {/* Will Do List */}
          {commissionType.dos && commissionType.dos.length > 0 && (
            <div>
              <h3 className="font-semibold text-green-700 mb-2">✓ Will Do:</h3>
              <ul className="space-y-1">
                {commissionType.dos.map((item, index) => (
                  <li key={index} className="text-sm">• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Won't Do List */}
          {commissionType.donts && commissionType.donts.length > 0 && (
            <div>
              <h3 className="font-semibold text-red-700 mb-2">✗ Won't Do:</h3>
              <ul className="space-y-1">
                {commissionType.donts.map((item, index) => (
                  <li key={index} className="text-sm">• {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}