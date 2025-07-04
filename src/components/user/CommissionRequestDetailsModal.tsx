
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface CommissionRequestWithRelations {
  id: string;
  title: string;
  description: string;
  deadline?: string;
  reference_images: string[];
  budget_range_min?: number;
  budget_range_max?: number;
  agreed_price?: number;
  status: string;
  customer_notes?: string;
  created_at: string;
  commission_type: {
    name: string;
    base_price: number;
  };
  creator: {
    display_name: string;
    profile_image_url?: string;
  };
}

interface CommissionRequestDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: CommissionRequestWithRelations;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'checkout_created':
      return 'bg-blue-100 text-blue-800';
    case 'payment_pending':
      return 'bg-orange-100 text-orange-800';
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'in_progress':
      return 'bg-purple-100 text-purple-800';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800';
    case 'delivered':
      return 'bg-cyan-100 text-cyan-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function CommissionRequestDetailsModal({ 
  open, 
  onOpenChange, 
  request 
}: CommissionRequestDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Commission Request Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-semibold">{request.title}</h3>
              <Badge className={getStatusColor(request.status)}>
                {request.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={request.creator.profile_image_url} />
                <AvatarFallback className="text-xs">
                  {request.creator.display_name?.substring(0, 2).toUpperCase() || 'CR'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{request.creator.display_name}</p>
                <p className="text-sm text-muted-foreground">{request.commission_type.name}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            <div className="p-4 bg-muted rounded-lg">
              <p className="whitespace-pre-wrap text-sm">{request.description}</p>
            </div>
          </div>

          {/* Customer Notes */}
          {request.customer_notes && (
            <div className="space-y-2">
              <h4 className="font-medium">Additional Notes</h4>
              <div className="p-4 bg-muted rounded-lg">
                <p className="whitespace-pre-wrap text-sm">{request.customer_notes}</p>
              </div>
            </div>
          )}

          {/* Deadline */}
          {request.deadline && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Preferred Deadline
              </h4>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  {format(new Date(request.deadline), 'EEEE, MMMM dd, yyyy')}
                </p>
              </div>
            </div>
          )}

          {/* Reference Images */}
          {request.reference_images && request.reference_images.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Reference Images</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {request.reference_images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Reference ${index + 1}`}
                    className="w-full h-24 object-cover rounded border hover:opacity-75 cursor-pointer transition-opacity"
                    onClick={() => window.open(image, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pricing Info */}
          <div className="space-y-2">
            <h4 className="font-medium">Pricing</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Base Price:</span>
                <p className="font-medium">${request.commission_type.base_price.toFixed(2)}</p>
              </div>
              {request.agreed_price && (
                <div>
                  <span className="text-muted-foreground">Agreed Price:</span>
                  <p className="font-medium">${request.agreed_price.toFixed(2)}</p>
                </div>
              )}
              {request.budget_range_min && request.budget_range_max && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Budget Range:</span>
                  <p className="font-medium">
                    ${request.budget_range_min.toFixed(2)} - ${request.budget_range_max.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <h4 className="font-medium">Timeline</h4>
            <div className="text-sm text-muted-foreground">
              <p>Submitted: {format(new Date(request.created_at), 'MMM dd, yyyy \'at\' h:mm a')}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
