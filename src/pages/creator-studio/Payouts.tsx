
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, Table as TableIcon, DollarSign } from "lucide-react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CreatorStudioPayouts() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-2xl font-bold">0.00</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-2xl font-bold">0.00</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-2xl font-bold">0.00</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Payouts</CardTitle>
            <CardDescription>View your payout history</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of your recent payouts</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/50">
                <TableCell colSpan={5} className="text-center py-6">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <TableIcon className="h-10 w-10 mb-2" />
                    <p>No payouts found</p>
                    <p className="text-sm">Your completed payouts will appear here</p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertTitle>Payment Method Required</AlertTitle>
        <AlertDescription>
          To receive payouts, you need to set up a payment method. This feature will be available soon.
        </AlertDescription>
      </Alert>
    </div>
  );
}
