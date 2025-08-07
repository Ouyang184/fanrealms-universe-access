
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Minus } from 'lucide-react';
import { CommissionType } from '@/types/commission';

interface CommissionTypeDisplayProps {
  commissionType: CommissionType;
  selectedAddons?: Array<{ name: string; price: number; quantity: number }>;
  onAddonsChange?: (addons: Array<{ name: string; price: number; quantity: number }>) => void;
  showAddonSelection?: boolean;
}

export function CommissionTypeDisplay({ 
  commissionType, 
  selectedAddons = [],
  onAddonsChange,
  showAddonSelection = false
}: CommissionTypeDisplayProps) {
  const [addonQuantities, setAddonQuantities] = useState<{ [key: string]: number }>(() => {
    const quantities: { [key: string]: number } = {};
    selectedAddons.forEach(addon => {
      quantities[addon.name] = addon.quantity;
    });
    return quantities;
  });

  const updateAddonQuantity = (addonName: string, addonPrice: number, quantity: number) => {
    const newQuantities = { ...addonQuantities, [addonName]: Math.max(0, quantity) };
    setAddonQuantities(newQuantities);

    if (onAddonsChange) {
      const newAddons = Object.entries(newQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([name, qty]) => {
          const addon = commissionType.custom_addons?.find(a => a.name === name);
          return {
            name,
            price: addon?.price || addonPrice,
            quantity: qty
          };
        });
      onAddonsChange(newAddons);
    }
  };

  const calculateTotalPrice = () => {
    let total = commissionType.base_price;
    
    if (showAddonSelection && commissionType.custom_addons) {
      commissionType.custom_addons.forEach(addon => {
        const quantity = addonQuantities[addon.name] || 0;
        total += addon.price * quantity;
      });
    }
    
    return total;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {commissionType.name}
          <Badge variant="outline">${commissionType.base_price} base</Badge>
        </CardTitle>
        {commissionType.description && (
          <p className="text-sm text-muted-foreground">{commissionType.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Turnaround:</span> {commissionType.estimated_turnaround_days} days
          </div>
          <div>
            <span className="font-medium">Max Revisions:</span> {commissionType.max_revisions}
          </div>
          {commissionType.price_per_revision && (
            <div className="col-span-2">
              <span className="font-medium">Extra Revision:</span> +${commissionType.price_per_revision}
            </div>
          )}
          {commissionType.price_per_character && (
            <div className="col-span-2">
              <span className="font-medium">Per Character:</span> +${commissionType.price_per_character}
            </div>
          )}
        </div>

        {/* Custom Add-ons */}
        {commissionType.custom_addons && commissionType.custom_addons.length > 0 && (
          <div className="space-y-3">
            <h5 className="font-medium text-blue-700">Available Add-ons:</h5>
            {commissionType.custom_addons.map((addon) => (
              <div key={addon.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{addon.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">${addon.price} each</span>
                </div>
                
                {showAddonSelection && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateAddonQuantity(addon.name, addon.price, (addonQuantities[addon.name] || 0) - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      value={addonQuantities[addon.name] || 0}
                      onChange={(e) => updateAddonQuantity(addon.name, addon.price, parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateAddonQuantity(addon.name, addon.price, (addonQuantities[addon.name] || 0) + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                {!showAddonSelection && (
                  <Badge variant="outline" className="text-blue-700 border-blue-300">
                    ${addon.price}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Total Price Display */}
        {showAddonSelection && (
          <div className="border-t pt-3">
            <div className="flex justify-between items-center font-medium">
              <span>Total Price:</span>
              <span className="text-lg">${calculateTotalPrice().toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Will Do / Won't Do */}
        {(commissionType.dos.length > 0 || commissionType.donts.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {commissionType.dos.length > 0 && (
              <div>
                <h5 className="font-medium text-green-700 mb-2">✓ Will Do:</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {commissionType.dos.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {commissionType.donts.length > 0 && (
              <div>
                <h5 className="font-medium text-red-700 mb-2">✗ Won't Do:</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {commissionType.donts.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
