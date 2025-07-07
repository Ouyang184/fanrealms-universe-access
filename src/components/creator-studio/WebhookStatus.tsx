
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface WebhookStatusProps {
  lastWebhookReceived?: string;
  webhookEvents?: number;
}

export function WebhookStatus({ lastWebhookReceived, webhookEvents = 0 }: WebhookStatusProps) {
  const isRecentWebhook = lastWebhookReceived 
    ? new Date(lastWebhookReceived) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Webhook Status
        </CardTitle>
        <CardDescription>
          Monitor webhook delivery for real-time earnings sync
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Webhook Status</span>
          <Badge variant={isRecentWebhook ? "default" : "secondary"}>
            {isRecentWebhook ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                No Recent Activity
              </>
            )}
          </Badge>
        </div>

        {lastWebhookReceived && (
          <div className="text-sm text-muted-foreground">
            Last webhook: {new Date(lastWebhookReceived).toLocaleString()}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          Total events processed: {webhookEvents}
        </div>

        {!isRecentWebhook && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If you've received payments but don't see recent webhook activity, 
              use the manual sync feature to ensure your earnings are up to date.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
