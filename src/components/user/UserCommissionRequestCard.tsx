
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, Eye, RotateCcw, Download, ExternalLink } from 'lucide-react';
import { CommissionRequest, CommissionRequestStatus } from '@/types/commission';
import { format } from 'date-fns';
import { DeleteCommissionRequestDialog } from './DeleteCommissionRequestDialog';
import { RequestRevisionModal } from './RequestRevisionModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCommissionDeliverables } from '@/hooks/useCommissionDeliverables';

interface UserCommissionRequestWithRelations extends Omit<CommissionRequest, 'status' | 'selected_addons'> {
  status: string;
  selected_addons: any; // Database Json type
  revision_count: number;
  commission_type: {
    name: string;
    base_price: number;
    max_revisions: number;
    price_per_revision?: number;
  };
  creator: {
    display_name: string;
    profile_image_url?: string;
  };
}

interface UserCommissionRequestCardProps {
  request: UserCommissionRequestWithRelations;
  onDelete: (requestId: string) => void;
  onRevisionCreated: () => void;
  isDeleting: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'payment_pending':
      return 'bg-blue-100 text-blue-800';
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

export function UserCommissionRequestCard({ 
  request, 
  onDelete, 
  onRevisionCreated,
  isDeleting 
}: UserCommissionRequestCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const { deliverables, getSignedUrl } = useCommissionDeliverables(request.id);
  const canDelete = request.status === 'pending' || request.status === 'rejected';
  const canRequestRevision = request.status === 'delivered' || request.status === 'completed';

  const handleDeleteClick = () => {
    console.log('Delete button clicked for request:', request.id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    console.log('Delete confirmed for request:', request.id);
    onDelete(request.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{request.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={request.creator?.profile_image_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {(request.creator?.display_name?.substring(0, 2).toUpperCase()) || 'CR'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {request.creator?.display_name ?? 'Unknown Creator'}
                </span>
              </div>
            </div>
            <Badge className={getStatusColor(request.status)}>
              {request.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Commission Type:</span>
              <p className="text-muted-foreground">{request.commission_type?.name ?? 'Unknown type'}</p>
            </div>
            <div>
              <span className="font-medium">Price:</span>
              <p className="text-muted-foreground">
                ${request.agreed_price?.toFixed(2) ?? request.commission_type?.base_price?.toFixed(2) ?? '—'}
              </p>
            </div>
            <div>
              <span className="font-medium">Created:</span>
              <p className="text-muted-foreground">
                {format(new Date(request.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
            {request.deadline && (
              <div>
                <span className="font-medium">Deadline:</span>
                <p className="text-muted-foreground">
                  {format(new Date(request.deadline), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
          </div>

          <div>
            <span className="font-medium text-sm">Description:</span>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
              {request.description}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View Details
            </Button>
            {deliverables.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeliveryModal(true)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Delivery
              </Button>
            )}
            
            {canRequestRevision && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRevisionModal(true)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <RotateCcw className="h-4 w-4" />
                Request Revision
              </Button>
            )}
            
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <DeleteCommissionRequestDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        requestTitle={request.title}
      />

      <RequestRevisionModal
        open={showRevisionModal}
        onOpenChange={setShowRevisionModal}
        commissionRequest={request}
        onRevisionCreated={onRevisionCreated}
      />

      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivered Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {deliverables.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deliveries yet.</p>
            ) : (
              deliverables.map((d) => (
                <div key={d.id} className="rounded border p-3">
                  {d.delivery_notes && (
                    <p className="text-sm mb-2">{d.delivery_notes}</p>
                  )}
                  <ul className="space-y-2">
                    {d.file_urls.map((path, idx) => (
                      <li key={idx} className="flex items-center justify-between text-sm">
                        <span className="truncate mr-2">{path.split('/').pop()}</span>
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              const url = await getSignedUrl(path);
                              window.open(url, '_blank');
                            } catch (e) {
                              console.error('Failed to get download link', e);
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" /> Download
                        </Button>
                      </li>
                    ))}
                  </ul>

                  {d.external_links && d.external_links.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium">External links</div>
                      <ul className="space-y-2 mt-1">
                        {d.external_links.map((link, i) => (
                          <li key={i} className="flex items-center justify-between text-sm">
                            <a href={link} target="_blank" rel="noopener noreferrer" className="truncate mr-2 underline">
                              {link}
                            </a>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(link, '_blank')}
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" /> Open
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    Delivered at {new Date(d.delivered_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
