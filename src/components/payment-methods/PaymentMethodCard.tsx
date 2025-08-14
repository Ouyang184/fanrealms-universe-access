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
  const { id, card_display, card_brand, card_last4, card_exp_month, card_exp_year, is_default } = paymentMethod;

  const getBrandIcon = (brand?: string) => {
    if (!brand) return null;
    
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
              {card_display ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{card_display}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {card_brand && getBrandIcon(card_brand)}
                  <span className="text-sm font-medium">
                    •••• •••• •••• {card_last4}
                  </span>
                </div>
              )}
              {card_exp_month && card_exp_year && !card_display && (
                <p className="text-xs text-muted-foreground">
                  Expires {String(card_exp_month).padStart(2, '0')}/{card_exp_year}
                </p>
              )}
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