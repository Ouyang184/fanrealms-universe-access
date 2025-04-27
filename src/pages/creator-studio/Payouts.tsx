
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock } from "lucide-react";

export default function CreatorStudioPayouts() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
      
      <Alert className="bg-primary/5 border-primary/30">
        <Clock className="h-4 w-4" />
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          The payouts feature is currently in development. You'll soon be able to track earnings and withdraw funds.
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Earnings Overview</CardTitle>
            <CardDescription>Track your creator revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Balance</span>
                <span className="text-xl font-bold">$0.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monthly Earnings</span>
                <span className="text-lg">$0.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Earnings</span>
                <span className="text-lg">$0.00</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Methods</CardTitle>
            <CardDescription>Configure withdrawal options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                Payment setup coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment History</CardTitle>
          <CardDescription>View your previous withdrawals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              No payment history available yet
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
