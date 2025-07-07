
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WebhookStatusProps {
  lastWebhookReceived?: string;
  webhookEvents?: number;
}

export function WebhookStatus({ lastWebhookReceived, webhookEvents = 0 }: WebhookStatusProps) {
  const isRecentWebhook = lastWebhookReceived 
    ? new Date(lastWebhookReceived) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    : false;

  const testWebhookEndpoint = async () => {
    try {
      const response = await fetch('https://eaeqyctjljbtcatlohky.supabase.co/functions/v1/stripe-webhook');
      const data = await response.json();
      console.log('Webhook test result:', data);
      alert(`Webhook endpoint test: ${data.status}`);
    } catch (error) {
      console.error('Webhook test failed:', error);
      alert('Webhook endpoint test failed - check console for details');
    }
  };

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

        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testWebhookEndpoint}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Test Webhook Endpoint
          </Button>
          
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <strong>Expected Webhook URL:</strong>
            <br />
            <code className="text-xs">
              https://eaeqyctjljbtcatlohky.supabase.co/functions/v1/stripe-webhook
            </code>
          </div>
        </div>

        {!isRecentWebhook && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If you've received payments but don't see recent webhook activity, 
              check your Stripe dashboard webhook configuration. The webhook URL above 
              should be configured to receive payment_intent.succeeded events.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
