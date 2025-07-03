
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Image, Video, Package } from 'lucide-react';
import { useCommissionDeliverables } from '@/hooks/useCommissionDeliverables';
import LoadingSpinner from '@/components/LoadingSpinner';

interface DeliverablesViewProps {
  commissionRequestId: string;
}

export function DeliverablesView({ commissionRequestId }: DeliverablesViewProps) {
  const { deliverables, isLoading } = useCommissionDeliverables(commissionRequestId);

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="h-4 w-4" />;
    }
    if (['mp4', 'mov', 'avi', 'mkv'].includes(extension || '')) {
      return <Video className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'Unknown file';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (deliverables.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Deliverables Yet</h3>
        <p className="text-muted-foreground">
          Work will appear here once the creator submits it
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Package className="h-5 w-5" />
        Delivered Work ({deliverables.length})
      </h3>
      
      {deliverables.map((deliverable) => (
        <Card key={deliverable.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Work Delivery</CardTitle>
              <Badge variant="outline">
                {new Date(deliverable.delivered_at).toLocaleDateString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliverable.delivery_notes && (
              <div>
                <h4 className="font-medium mb-2">Creator Notes:</h4>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                  {deliverable.delivery_notes}
                </p>
              </div>
            )}
            
            <div>
              <h4 className="font-medium mb-3">Files ({deliverable.file_urls.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {deliverable.file_urls.map((url, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(url)}
                      <span className="text-sm font-medium truncate max-w-48">
                        {getFileName(url)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
