
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { toast } from "@/hooks/use-toast";

interface CreateCommissionTypeModalProps {
  onSuccess: () => void;
  children: React.ReactNode;
}

interface CustomAddon {
  name: string;
  price: number;
}

export function CreateCommissionTypeModal({ onSuccess, children }: CreateCommissionTypeModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { creatorProfile } = useCreatorProfile();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: "",
    price_per_revision: "",
    estimated_turnaround_days: "",
    max_revisions: "",
  });
  
  const [dos, setDos] = useState<string[]>([]);
  const [donts, setDonts] = useState<string[]>([]);
  const [customAddons, setCustomAddons] = useState<CustomAddon[]>([]);
  const [newDo, setNewDo] = useState("");
  const [newDont, setNewDont] = useState("");
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorProfile?.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('commission_types')
        .insert({
          creator_id: creatorProfile.id,
          name: formData.name,
          description: formData.description || null,
          base_price: parseFloat(formData.base_price),
          price_per_revision: formData.price_per_revision ? parseFloat(formData.price_per_revision) : null,
          estimated_turnaround_days: parseInt(formData.estimated_turnaround_days),
          max_revisions: parseInt(formData.max_revisions),
          dos: dos,
          donts: donts,
          custom_addons: customAddons,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission type created successfully!"
      });
      
      setOpen(false);
      onSuccess();
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        base_price: "",
        price_per_revision: "",
        estimated_turnaround_days: "",
        max_revisions: "",
      });
      setDos([]);
      setDonts([]);
      setCustomAddons([]);
    } catch (error) {
      console.error('Error creating commission type:', error);
      toast({
        title: "Error",
        description: "Failed to create commission type",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addDo = () => {
    if (newDo.trim()) {
      setDos([...dos, newDo.trim()]);
      setNewDo("");
    }
  };

  const addDont = () => {
    if (newDont.trim()) {
      setDonts([...donts, newDont.trim()]);
      setNewDont("");
    }
  };

  const addCustomAddon = () => {
    if (newAddonName.trim() && newAddonPrice && parseFloat(newAddonPrice) > 0) {
      setCustomAddons([...customAddons, {
        name: newAddonName.trim(),
        price: parseFloat(newAddonPrice)
      }]);
      setNewAddonName("");
      setNewAddonPrice("");
    }
  };

  const removeCustomAddon = (index: number) => {
    setCustomAddons(customAddons.filter((_, i) => i !== index));
  };

  const removeDo = (index: number) => {
    setDos(dos.filter((_, i) => i !== index));
  };

  const removeDont = (index: number) => {
    setDonts(donts.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Commission Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Character Portrait"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_price">Base Price ($) *</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                placeholder="50.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this commission type includes..."
              rows={3}
            />
          </div>

          {/* Custom Add-ons Section */}
          <div className="space-y-2">
            <Label>Custom Add-ons</Label>
            <div className="flex gap-2">
              <Input
                value={newAddonName}
                onChange={(e) => setNewAddonName(e.target.value)}
                placeholder="Add-on name (e.g., Extra Character)"
                className="flex-1"
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newAddonPrice}
                onChange={(e) => setNewAddonPrice(e.target.value)}
                placeholder="Price"
                className="w-24"
              />
              <Button type="button" onClick={addCustomAddon} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {customAddons.map((addon, index) => (
                <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                  {addon.name} - ${addon.price}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeCustomAddon(index)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_per_revision">Price per Extra Revision ($)</Label>
              <Input
                id="price_per_revision"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_per_revision}
                onChange={(e) => setFormData({ ...formData, price_per_revision: e.target.value })}
                placeholder="10.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_turnaround_days">Turnaround (days) *</Label>
              <Input
                id="estimated_turnaround_days"
                type="number"
                min="1"
                value={formData.estimated_turnaround_days}
                onChange={(e) => setFormData({ ...formData, estimated_turnaround_days: e.target.value })}
                placeholder="7"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_revisions">Max Revisions *</Label>
            <Input
              id="max_revisions"
              type="number"
              min="0"
              value={formData.max_revisions}
              onChange={(e) => setFormData({ ...formData, max_revisions: e.target.value })}
              placeholder="3"
              required
            />
          </div>

          {/* Will Do Section */}
          <div className="space-y-2">
            <Label>What You Will Do</Label>
            <div className="flex gap-2">
              <Input
                value={newDo}
                onChange={(e) => setNewDo(e.target.value)}
                placeholder="Add something you will do..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDo())}
              />
              <Button type="button" onClick={addDo} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {dos.map((item, index) => (
                <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                  {item}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeDo(index)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Won't Do Section */}
          <div className="space-y-2">
            <Label>What You Won't Do</Label>
            <div className="flex gap-2">
              <Input
                value={newDont}
                onChange={(e) => setNewDont(e.target.value)}
                placeholder="Add something you won't do..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDont())}
              />
              <Button type="button" onClick={addDont} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {donts.map((item, index) => (
                <Badge key={index} variant="outline" className="text-red-700 border-red-300">
                  {item}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeDont(index)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Commission Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
