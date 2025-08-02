import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentMethodsModalProps {
  children: React.ReactNode;
}

export function PaymentMethodsModal({ children }: PaymentMethodsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleOpenPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Open Stripe Customer Portal in a new tab
        window.open(data.url, '_blank');
        setIsOpen(false);
        toast({
          title: "Redirected to Payment Methods",
          description: "You can manage your payment methods in the new tab.",
        });
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (error) {
      console.error('Error opening payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to open payment methods. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manage your payment methods, update billing information, and view payment history through our secure payment portal.
          </p>

          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">What you can do:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Add or remove payment methods</li>
                <li>• Update billing addresses</li>
                <li>• View payment history</li>
                <li>• Download invoices</li>
                <li>• Update default payment method</li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={handleOpenPaymentMethods}
            disabled={isLoading}
            className="w-full gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            {isLoading ? 'Opening...' : 'Open Payment Portal'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            You'll be redirected to a secure Stripe portal to manage your payment methods.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}