
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { toast } from "@/hooks/use-toast";

interface CommissionSettingsModalProps {
  children: React.ReactNode;
}

export function CommissionSettingsModal({ children }: CommissionSettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { creatorProfile } = useCreatorProfile();
  
  const [settings, setSettings] = useState({
    accepts_commissions: false,
    commission_base_rate: "",
    commission_turnaround_days: "",
    commission_slots_available: "",
    commission_tos: "",
  });

  useEffect(() => {
    if (creatorProfile && open) {
      setSettings({
        accepts_commissions: creatorProfile.accepts_commissions || false,
        commission_base_rate: creatorProfile.commission_base_rate?.toString() || "",
        commission_turnaround_days: creatorProfile.commission_turnaround_days?.toString() || "",
        commission_slots_available: creatorProfile.commission_slots_available?.toString() || "",
        commission_tos: creatorProfile.commission_tos || "",
      });
    }
  }, [creatorProfile, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorProfile?.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('creators')
        .update({
          accepts_commissions: settings.accepts_commissions,
          commission_base_rate: settings.commission_base_rate ? parseFloat(settings.commission_base_rate) : null,
          commission_turnaround_days: settings.commission_turnaround_days ? parseInt(settings.commission_turnaround_days) : null,
          commission_slots_available: settings.commission_slots_available ? parseInt(settings.commission_slots_available) : null,
          commission_tos: settings.commission_tos || null,
        })
        .eq('id', creatorProfile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission settings updated successfully!"
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Error updating commission settings:', error);
      toast({
        title: "Error",
        description: "Failed to update commission settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Commission Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Accept Commissions</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable commission requests
              </p>
            </div>
            <Switch
              checked={settings.accepts_commissions}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, accepts_commissions: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_base_rate">Starting Price ($)</Label>
            <Input
              id="commission_base_rate"
              type="number"
              step="0.01"
              min="0"
              value={settings.commission_base_rate}
              onChange={(e) => setSettings({ ...settings, commission_base_rate: e.target.value })}
              placeholder="50.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_turnaround_days">Default Turnaround (days)</Label>
            <Input
              id="commission_turnaround_days"
              type="number"
              min="1"
              value={settings.commission_turnaround_days}
              onChange={(e) => setSettings({ ...settings, commission_turnaround_days: e.target.value })}
              placeholder="7"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_slots_available">Available Slots</Label>
            <Input
              id="commission_slots_available"
              type="number"
              min="0"
              value={settings.commission_slots_available}
              onChange={(e) => setSettings({ ...settings, commission_slots_available: e.target.value })}
              placeholder="5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_tos">Terms of Service</Label>
            <Textarea
              id="commission_tos"
              value={settings.commission_tos}
              onChange={(e) => setSettings({ ...settings, commission_tos: e.target.value })}
              placeholder="Enter your commission terms and conditions..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
