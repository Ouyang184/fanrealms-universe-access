
import { UserCommissionRequestCard } from '@/components/user/UserCommissionRequestCard';
import { useUserCommissionRequests } from '@/hooks/useUserCommissionRequests';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FileText } from 'lucide-react';

export default function Requests() {
  const { requests, isLoading, deleteRequest, isDeleting, refetch } = useUserCommissionRequests();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Commission Requests</h1>
        <p className="text-muted-foreground">
          View and manage your commission requests
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No commission requests</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You haven't made any commission requests yet. Browse creators and request custom work to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <UserCommissionRequestCard
              key={request.id}
              request={request}
              onDelete={deleteRequest}
              onRevisionCreated={refetch}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
