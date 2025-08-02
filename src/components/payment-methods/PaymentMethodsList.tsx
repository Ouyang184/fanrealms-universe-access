import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, CreditCard } from "lucide-react";
import { PaymentMethodCard } from "./PaymentMethodCard";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import LoadingSpinner from "@/components/LoadingSpinner";

export function PaymentMethodsList() {
  const {
    paymentMethods,
    isLoading,
    refetch,
    setAsDefault,
    isSettingDefault,
    deletePaymentMethod,
    isDeleting
  } = usePaymentMethods();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Saved Payment Methods
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No payment methods</h3>
            <p className="text-muted-foreground">
              Add a payment method to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {paymentMethods.map((paymentMethod) => (
              <PaymentMethodCard
                key={paymentMethod.id}
                paymentMethod={paymentMethod}
                onSetDefault={setAsDefault}
                onDelete={deletePaymentMethod}
                isSettingDefault={isSettingDefault}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}