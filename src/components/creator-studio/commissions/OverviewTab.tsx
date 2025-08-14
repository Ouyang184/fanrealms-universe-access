
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Calendar, Settings, Inbox } from 'lucide-react';

interface CommissionRequestWithRelations {
  id: string;
  title: string;
  status: string;
  created_at: string;
  customer?: {
    username: string;
    profile_picture?: string;
  };
}

interface OverviewTabProps {
  activeTypes: number;
  pendingRequests: number;
  inProgressRequests: number;
  monthlyEarnings: number;
  requests: CommissionRequestWithRelations[];
  onViewAllRequests: () => void;
}

export function OverviewTab({
  activeTypes,
  pendingRequests,
  inProgressRequests,
  monthlyEarnings,
  requests,
  onViewAllRequests
}: OverviewTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Types</CardTitle>
            <Palette className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold">{activeTypes}</div>
            <p className="text-xs text-muted-foreground">
              Commission types available
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
            <Inbox className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your response
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">In Progress</CardTitle>
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold">{inProgressRequests}</div>
            <p className="text-xs text-muted-foreground">
              Active commissions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold">${monthlyEarnings}</div>
            <p className="text-xs text-muted-foreground">
              Commission earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Recent Commission Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {requests.slice(0, 3).map((request, index) => (
                <div key={`${request.id}-${index}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2 sm:gap-0">
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base">{request.title}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      by @{request.customer?.username || 'Unknown'} • {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={`${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  } text-xs self-start sm:self-center`}>
                    {request.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full mt-4 text-sm"
                onClick={onViewAllRequests}
              >
                View All Requests
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Inbox className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No Recent Activity</h3>
              <p className="text-sm text-muted-foreground">
                Commission requests will appear here once customers start submitting them
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
