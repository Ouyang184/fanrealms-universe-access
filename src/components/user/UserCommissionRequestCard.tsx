
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, Calendar, DollarSign, User } from 'lucide-react';
import { CommissionRequestStatus } from '@/types/commission';
import { DeliverablesView } from '@/components/creator-studio/commissions/DeliverablesView';

interface UserCommissionRequestCardProps {
  request: {
    id: string;
    title: string;
    description: string;
    status: CommissionRequestStatus;
    agreed_price?: number;
    deadline?: string;
    created_at: string;
    commission_type: {
      name: string;
      base_price: number;
      description: string;
    };
    creator: {
      display_name: string;
      profile_image_url?: string;
    };
  };
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const getStatusColor = (status: CommissionRequestStatus) => {
  switch (status) {
    case 'pending': return 'bg-yellow-500';
    case 'accepted': return 'bg-green-500';
    case 'rejected': return 'bg-red-500';
    case 'in_progress': return 'bg-blue-500';
    case 'completed': return 'bg-purple-500';
    case 'delivered': return 'bg-green-600';
    case 'cancelled': return 'bg-gray-500';
    default: return 'bg-gray-400';
  }
};

export function UserCommissionRequestCard({ request, onDelete, isDeleting }: UserCommissionRequestCardProps) {
  const canDelete = ['pending', 'rejected'].includes(request.status);
  const showDeliverables = ['delivered', 'completed'].includes(request.status);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">{request.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={request.creator.profile_image_url} />
                <AvatarFallback>
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {request.creator.display_name || 'Unknown Creator'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(request.status)}>
              {request.status.replace('_', ' ')}
            </Badge>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(request.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-sm text-muted-foreground">{request.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Price: ${request.agreed_price || request.commission_type.base_price}</span>
          </div>
          {request.deadline && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Deadline: {new Date(request.deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Requested: {new Date(request.created_at).toLocaleString()}
        </div>

        {showDeliverables && (
          <div className="mt-6 pt-4 border-t">
            <DeliverablesView commissionRequestId={request.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
