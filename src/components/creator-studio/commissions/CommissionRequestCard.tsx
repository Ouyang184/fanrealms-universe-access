
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, DollarSign, MessageSquare, User, FileText } from "lucide-react";
import { CommissionRequest, CommissionRequestStatus } from "@/types/commission";

interface CommissionRequestCardProps {
  request: CommissionRequest & {
    commission_type: {
      name: string;
      base_price: number;
    };
    customer: {
      username: string;
      profile_picture?: string;
    };
  };
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onUpdateStatus: (id: string, status: CommissionRequestStatus) => void;
}

const statusColors: Record<CommissionRequestStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export function CommissionRequestCard({ request, onAccept, onReject, onUpdateStatus }: CommissionRequestCardProps) {
  const canAcceptOrReject = request.status === 'pending';
  const canMarkInProgress = request.status === 'accepted';
  const canMarkCompleted = request.status === 'in_progress';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={request.customer.profile_picture} />
              <AvatarFallback>
                {request.customer.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{request.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                by @{request.customer.username}
              </p>
            </div>
          </div>
          <Badge className={statusColors[request.status]}>
            {request.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Commission Type
          </h4>
          <p className="text-sm text-muted-foreground">
            {request.commission_type.name} (Base: ${request.commission_type.base_price})
          </p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-sm text-muted-foreground">{request.description}</p>
        </div>

        {(request.budget_range_min || request.budget_range_max) && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget Range
            </h4>
            <p className="text-sm text-muted-foreground">
              ${request.budget_range_min || 0} - ${request.budget_range_max || 'Open'}
            </p>
          </div>
        )}

        {request.agreed_price && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Agreed Price
            </h4>
            <p className="text-sm font-semibold text-green-600">
              ${request.agreed_price}
            </p>
          </div>
        )}

        {request.deadline && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Deadline
            </h4>
            <p className="text-sm text-muted-foreground">
              {new Date(request.deadline).toLocaleDateString()}
            </p>
          </div>
        )}

        {request.customer_notes && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Customer Notes
            </h4>
            <p className="text-sm text-muted-foreground">{request.customer_notes}</p>
          </div>
        )}

        {request.creator_notes && (
          <div>
            <h4 className="font-medium mb-2">Your Notes</h4>
            <p className="text-sm text-muted-foreground">{request.creator_notes}</p>
          </div>
        )}

        <Separator />
        
        <div className="flex gap-2 flex-wrap">
          {canAcceptOrReject && (
            <>
              <Button
                onClick={() => onAccept(request.id)}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                Accept
              </Button>
              <Button
                onClick={() => onReject(request.id)}
                variant="outline"
                size="sm"
              >
                Reject
              </Button>
            </>
          )}
          
          {canMarkInProgress && (
            <Button
              onClick={() => onUpdateStatus(request.id, 'in_progress')}
              size="sm"
            >
              Start Work
            </Button>
          )}
          
          {canMarkCompleted && (
            <Button
              onClick={() => onUpdateStatus(request.id, 'completed')}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              Mark Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
