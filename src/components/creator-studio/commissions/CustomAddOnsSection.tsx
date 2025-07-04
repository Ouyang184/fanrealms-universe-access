
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { CommissionAddon } from "@/types/commission";

interface CustomAddonsSectionProps {
  addons: CommissionAddon[];
  onAddonsChange: (addons: CommissionAddon[]) => void;
}

export function CustomAddonsSection({ addons, onAddonsChange }: CustomAddonsSectionProps) {
  const [newAddon, setNewAddon] = useState({ name: "", price: "" });

  const addAddon = () => {
    if (newAddon.name.trim() && newAddon.price) {
      const addon: CommissionAddon = {
        id: Date.now().toString(),
        name: newAddon.name.trim(),
        price: parseFloat(newAddon.price)
      };
      onAddonsChange([...addons, addon]);
      setNewAddon({ name: "", price: "" });
    }
  };

  const removeAddon = (id: string) => {
    onAddonsChange(addons.filter(addon => addon.id !== id));
  };

  return (
    <div className="space-y-4">
      <Label>Custom Add-Ons</Label>
      <p className="text-sm text-muted-foreground">
        Define specific add-ons customers can purchase with your commission
      </p>
      
      {/* Add new addon form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4 border rounded-lg">
        <div className="space-y-1">
          <Label className="text-xs">Add-On Name</Label>
          <Input
            value={newAddon.name}
            onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
            placeholder="e.g., Full Body, Background"
            className="text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Price ($)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={newAddon.price}
            onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })}
            placeholder="25.00"
            className="text-sm"
          />
        </div>
        <div className="flex items-end">
          <Button 
            type="button" 
            onClick={addAddon} 
            size="sm" 
            className="w-full"
            disabled={!newAddon.name.trim() || !newAddon.price}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Add-On
          </Button>
        </div>
      </div>

      {/* Current addons display */}
      {addons.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Current Add-Ons:</Label>
          <div className="grid gap-2">
            {addons.map((addon) => (
              <div key={addon.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <span className="font-medium">{addon.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    ${addon.price.toFixed(2)}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAddon(addon.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {addons.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">No custom add-ons defined yet.</p>
          <p className="text-xs">Add some above to give customers more options!</p>
        </div>
      )}
    </div>
  );
}
