
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  Webhook, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  RefreshCw,
  Settings,
  Clock
} from 'lucide-react';

interface WebhookDiagnostics {
  webhookEndpoints: Array<{
    id: string;
    url: string;
    status: string;
    enabled_events: string[];
    created: string;
    livemode: boolean;
  }>;
  expectedWebhookUrl: string;
  testWebhookSecret: string;
  liveWebhookSecret: string;
  recentStripeEvents: Array<{
    id: string;
    type: string;
    created: string;
    object_id: string;
    livemode: boolean;
  }>;
  recommendations: Array<{
    issue: string;
    solution: string;
    priority: string;
  }>;
}

export function WebhookDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<WebhookDiagnostics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('webhook-diagnostics');
      
      if (error) throw error;
      
      setDiagnostics(data);
      
      const highPriorityIssues = data.recommendations?.filter(r => r.priority === 'HIGH').length || 0;
      
      if (highPriorityIssues > 0) {
        toast({
          title: "Webhook Issues Found",
          description: `Found ${highPriorityIssues} high priority issues that need attention`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Diagnostics Complete",
          description: "Webhook configuration looks good!",
        });
      }
    } catch (error) {
      console.error('Error running diagnostics:', error);
      toast({
        title: "Diagnostics Failed",
        description: "Failed to run webhook diagnostics. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhook Diagnostics
        </CardTitle>
        <CardDescription>
          Check your Stripe webhook configuration and debug commission payment issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runDiagnostics}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Settings className="mr-2 h-4 w-4" />
          )}
          Run Webhook Diagnostics
        </Button>

        {diagnostics && (
          <div className="space-y-4">
            {/* High Priority Issues */}
            {diagnostics.recommendations?.filter(r => r.priority === 'HIGH').length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Critical Issues Found:</strong>
                  <ul className="mt-2 space-y-1">
                    {diagnostics.recommendations
                      .filter(r => r.priority === 'HIGH')
                      .map((rec, index) => (
                        <li key={index} className="text-sm">
                          • <strong>{rec.issue}:</strong> {rec.solution}
                        </li>
                      ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Webhook Endpoints */}
            <div>
              <h4 className="font-medium mb-2">Configured Webhook Endpoints</h4>
              {diagnostics.webhookEndpoints.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No webhook endpoints configured. You need to add one in your Stripe dashboard.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {diagnostics.webhookEndpoints.map((endpoint) => (
                    <div key={endpoint.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={endpoint.status === 'enabled' ? 'default' : 'secondary'}>
                            {endpoint.status}
                          </Badge>
                          <Badge variant={endpoint.livemode ? 'destructive' : 'outline'}>
                            {endpoint.livemode ? 'Live' : 'Test'}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(endpoint.created).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-mono bg-muted p-2 rounded">
                        {endpoint.url}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {endpoint.enabled_events.length} events configured
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Recent Stripe Events */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Stripe Events
              </h4>
              {diagnostics.recentStripeEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent events found</p>
              ) : (
                <div className="space-y-2">
                  {diagnostics.recentStripeEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="text-sm font-medium">{event.type}</span>
                        <p className="text-xs text-muted-foreground">{event.object_id}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={event.livemode ? 'destructive' : 'outline'}>
                          {event.livemode ? 'Live' : 'Test'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.created).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Configuration Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded">
                <h5 className="font-medium text-sm">Expected Webhook URL</h5>
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {diagnostics.expectedWebhookUrl}
                </p>
              </div>
              <div className="p-3 border rounded">
                <h5 className="font-medium text-sm">Webhook Secrets</h5>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {diagnostics.testWebhookSecret === 'Set' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                    )}
                    <span className="text-xs">Test: {diagnostics.testWebhookSecret}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {diagnostics.liveWebhookSecret === 'Set' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                    )}
                    <span className="text-xs">Live: {diagnostics.liveWebhookSecret}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://dashboard.stripe.com/test/webhooks', '_blank')}
              >
                <ExternalLink className="mr-2 h-3 w-3" />
                Stripe Test Webhooks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://dashboard.stripe.com/test/events', '_blank')}
              >
                <ExternalLink className="mr-2 h-3 w-3" />
                Stripe Test Events
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
