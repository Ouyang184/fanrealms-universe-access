
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, Eye } from 'lucide-react';
import { CommissionRequest, CommissionRequestStatus } from '@/types/commission';
import { format } from 'date-fns';
import { DeleteCommissionRequestDialog } from './DeleteCommissionRequestDialog';

interface UserCommissionRequestWithRelations extends Omit<CommissionRequest, 'status'> {
  status: string;
  commission_type: {
    name: string;
    base_price: number;
  };
  creator: {
    display_name: string;
    profile_image_url?: string;
  };
}

interface UserCommissionRequestCardProps {
  request: UserCommissionRequestWithRelations;
  onDelete: (requestId: string) => void;
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
  isDeleting 
}: UserCommissionRequestCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const canDelete = request.status === 'pending' || request.status === 'rejected';

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
                  <AvatarImage src={request.creator.profile_image_url} />
                  <AvatarFallback className="text-xs">
                    {request.creator.display_name?.substring(0, 2).toUpperCase() || 'CR'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {request.creator.display_name}
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
              <p className="text-muted-foreground">{request.commission_type.name}</p>
            </div>
            <div>
              <span className="font-medium">Price:</span>
              <p className="text-muted-foreground">
                ${request.agreed_price?.toFixed(2) || request.commission_type.base_price.toFixed(2)}
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
    </>
  );
}
