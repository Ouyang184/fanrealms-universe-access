
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Calendar, Settings, Inbox } from 'lucide-react';
import { CommissionRequest } from '@/types/commission';

interface OverviewTabProps {
  activeTypes: number;
  pendingRequests: number;
  inProgressRequests: number;
  monthlyEarnings: number;
  requests: CommissionRequest[];
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Types</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTypes}</div>
            <p className="text-xs text-muted-foreground">
              Commission types available
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your response
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressRequests}</div>
            <p className="text-xs text-muted-foreground">
              Active commissions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyEarnings}</div>
            <p className="text-xs text-muted-foreground">
              Commission earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commission Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <div className="space-y-4">
              {requests.slice(0, 3).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{request.title}</p>
                    <p className="text-sm text-muted-foreground">
                      by @{request.customer?.username} • {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={`${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {request.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={onViewAllRequests}
              >
                View All Requests
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Inbox className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
              <p className="text-muted-foreground">
                Commission requests will appear here once customers start submitting them
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
