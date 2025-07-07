
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export function WebhookDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    const newResults: DiagnosticResult[] = [];

    // Test 1: Webhook endpoint connectivity
    try {
      const response = await fetch('https://eaeqyctjljbtcatlohky.supabase.co/functions/v1/stripe-webhook', {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        newResults.push({
          test: 'Webhook Endpoint Connectivity',
          status: 'success',
          message: 'Webhook endpoint is reachable',
          details: data
        });
      } else {
        newResults.push({
          test: 'Webhook Endpoint Connectivity',
          status: 'error',
          message: `Webhook endpoint returned ${response.status}`,
          details: { status: response.status, statusText: response.statusText }
        });
      }
    } catch (error) {
      newResults.push({
        test: 'Webhook Endpoint Connectivity',
        status: 'error',
        message: 'Failed to reach webhook endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Check recent function logs (would need to implement this via edge function)
    newResults.push({
      test: 'Recent Webhook Activity',
      status: 'warning',
      message: 'Check Supabase function logs for recent webhook activity',
      details: 'Manual check required in Supabase dashboard'
    });

    // Test 3: Environment check
    newResults.push({
      test: 'Environment Configuration',
      status: 'warning',
      message: 'Verify Stripe webhook secret and live keys are configured',
      details: 'Check Supabase secrets and Stripe dashboard configuration'
    });

    setResults(newResults);
    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status]} className="ml-2">
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Webhook Diagnostics
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              'Run Diagnostics'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.length === 0 && !isRunning && (
          <p className="text-muted-foreground">
            Click "Run Diagnostics" to test webhook connectivity and configuration.
          </p>
        )}

        {results.map((result, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(result.status)}
                <span className="font-medium">{result.test}</span>
              </div>
              {getStatusBadge(result.status)}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              {result.message}
            </p>
            
            {result.details && (
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {typeof result.details === 'string' 
                  ? result.details 
                  : JSON.stringify(result.details, null, 2)
                }
              </pre>
            )}
          </div>
        ))}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Expected Webhook URL</h4>
          <code className="text-sm bg-blue-100 px-2 py-1 rounded">
            https://eaeqyctjljbtcatlohky.supabase.co/functions/v1/stripe-webhook
          </code>
          <p className="text-sm text-blue-700 mt-2">
            This URL should be configured in your Stripe dashboard for the following events:
            <br />• payment_intent.succeeded
            <br />• customer.subscription.created
            <br />• customer.subscription.updated  
            <br />• customer.subscription.deleted
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
