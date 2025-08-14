import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Trash2, Star } from "lucide-react";
import { PaymentMethod } from "@/hooks/usePaymentMethods";

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  isSettingDefault: boolean;
  isDeleting: boolean;
}

export function PaymentMethodCard({ 
  paymentMethod, 
  onSetDefault, 
  onDelete, 
  isSettingDefault, 
  isDeleting 
}: PaymentMethodCardProps) {
  const { id, type, card, is_default, display_text } = paymentMethod;

  const getBrandIcon = (brand: string) => {
    const brandClass = `w-8 h-5 bg-gradient-to-r ${
      brand === 'visa' ? 'from-blue-600 to-blue-700' :
      brand === 'mastercard' ? 'from-red-500 to-orange-500' :
      brand === 'amex' ? 'from-green-500 to-blue-500' :
      'from-gray-400 to-gray-500'
    } rounded text-white text-xs flex items-center justify-center font-bold`;
    
    return (
      <div className={brandClass}>
        {brand.slice(0, 4).toUpperCase()}
      </div>
    );
  };

  return (
    <Card className={`relative ${is_default ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                {card && getBrandIcon(card.brand)}
                <span className="text-sm font-medium">
                  {display_text || `${type} payment method`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Secure payment method • Details masked for security
              </p>
            </div>
          </div>
          
          {is_default && (
            <Badge variant="default" className="gap-1">
              <Star className="h-3 w-3" />
              Default
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          {!is_default && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetDefault(id)}
              disabled={isSettingDefault}
              className="flex-1"
            >
              Set as Default
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(id)}
            disabled={isDeleting || is_default}
            className="gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}