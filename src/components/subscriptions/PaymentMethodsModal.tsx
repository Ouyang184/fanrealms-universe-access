import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PaymentMethodsModalProps {
  children: React.ReactNode;
}

export function PaymentMethodsModal({ children }: PaymentMethodsModalProps) {
  const navigate = useNavigate();

  const handleOpenPaymentMethods = () => {
    navigate('/payment-methods');
  };

  return (
    <div onClick={handleOpenPaymentMethods} className="cursor-pointer">
      {children}
    </div>
  );
}