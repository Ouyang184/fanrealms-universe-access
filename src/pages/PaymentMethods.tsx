import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { MainLayout } from "@/components/Layout/MainLayout";
import { PaymentMethodsList } from "@/components/payment-methods/PaymentMethodsList";
import { AddPaymentMethodForm } from "@/components/payment-methods/AddPaymentMethodForm";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";

// Initialize Stripe with publishable key from environment
const stripePromise = loadStripe(
  window.env?.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

export default function PaymentMethodsPage() {
  useAuthCheck();
  
  const { refetch, createSetupIntent, isCreatingSetupIntent } = usePaymentMethods();

  const handlePaymentMethodAdded = () => {
    refetch();
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto w-full p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Payment Methods</h1>
          <p className="text-muted-foreground">
            Manage your payment methods for subscriptions and purchases
          </p>
        </div>

        <Elements stripe={stripePromise}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <PaymentMethodsList />
            </div>
            
            <div>
              <AddPaymentMethodForm
                onSuccess={handlePaymentMethodAdded}
                createSetupIntent={createSetupIntent}
                isCreatingSetupIntent={isCreatingSetupIntent}
              />
            </div>
          </div>
        </Elements>
      </div>
    </MainLayout>
  );
}