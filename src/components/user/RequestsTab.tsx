
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2 } from 'lucide-react';
import { useUserCommissionRequests } from '@/hooks/useUserCommissionRequests';
import { UserCommissionRequestCard } from './UserCommissionRequestCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export function RequestsTab() {
  const { requests, isLoading, deleteRequest, isDeleting } = useUserCommissionRequests();

  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const activeRequests = requests.filter(r => 
    ['accepted', 'in_progress', 'completed', 'delivered'].includes(r.status)
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          My Commission Requests
          <div className="flex gap-2 ml-auto">
            {pendingRequests > 0 && (
              <Badge variant="outline" className="bg-yellow-50">
                {pendingRequests} pending
              </Badge>
            )}
            {activeRequests > 0 && (
              <Badge variant="outline" className="bg-green-50">
                {activeRequests} active
              </Badge>
            )}
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          View and manage your commission requests to creators
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Requests Yet</h3>
            <p className="text-muted-foreground">
              You haven't made any commission requests yet. Browse creators to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <UserCommissionRequestCard
                key={request.id}
                request={request}
                onDelete={deleteRequest}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
