
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { CommissionType } from '@/types/commission';
import { Loader2 } from 'lucide-react';

interface CommissionRequestModalProps {
  children: React.ReactNode;
  commissionTypes: CommissionType[];
  creatorId: string;
  specificCommissionType?: CommissionType;
}

export function CommissionRequestModal({ 
  children, 
  commissionTypes, 
  creatorId, 
  specificCommissionType 
}: CommissionRequestModalProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    commission_type_id: specificCommissionType?.id || '',
    title: '',
    description: '',
    budget_range_min: '',
    budget_range_max: '',
    deadline: '',
    customer_notes: ''
  });

  // Update form data when specific commission type changes
  React.useEffect(() => {
    if (specificCommissionType) {
      setFormData(prev => ({
        ...prev,
        commission_type_id: specificCommissionType.id
      }));
    }
  }, [specificCommissionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to request a commission",
        variant: "destructive"
      });
      return;
    }

    if (!formData.commission_type_id || !formData.title || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        commission_type_id: formData.commission_type_id,
        customer_id: user.id,
        creator_id: creatorId,
        title: formData.title,
        description: formData.description,
        budget_range_min: formData.budget_range_min ? parseFloat(formData.budget_range_min) : null,
        budget_range_max: formData.budget_range_max ? parseFloat(formData.budget_range_max) : null,
        deadline: formData.deadline || null,
        customer_notes: formData.customer_notes || null,
        status: 'pending'
      };

      const { error } = await supabase
        .from('commission_requests')
        .insert([requestData]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your commission request has been submitted successfully"
      });

      // Reset form and close modal
      setFormData({
        commission_type_id: specificCommissionType?.id || '',
        title: '',
        description: '',
        budget_range_min: '',
        budget_range_max: '',
        deadline: '',
        customer_notes: ''
      });
      setOpen(false);

    } catch (error) {
      console.error('Error submitting commission request:', error);
      toast({
        title: "Error",
        description: "Failed to submit commission request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = specificCommissionType || commissionTypes.find(type => type.id === formData.commission_type_id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {specificCommissionType 
              ? `Request: ${specificCommissionType.name}` 
              : 'Request Commission'
            }
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Only show commission type selector if no specific type is provided */}
          {!specificCommissionType && (
            <div className="space-y-2">
              <Label htmlFor="commission_type">Commission Type *</Label>
              <Select 
                value={formData.commission_type_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, commission_type_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a commission type" />
                </SelectTrigger>
                <SelectContent>
                  {commissionTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} - ${type.base_price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Only show commission type info if no specific type is provided */}
          {selectedType && !specificCommissionType && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">{selectedType.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">{selectedType.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Base Price: ${selectedType.base_price}</div>
                <div>Turnaround: {selectedType.estimated_turnaround_days} days</div>
                <div>Max Revisions: {selectedType.max_revisions}</div>
                {selectedType.price_per_character && (
                  <div>Per Character: +${selectedType.price_per_character}</div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief title for your commission"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of what you want commissioned"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget_min">Budget Range Min ($)</Label>
              <Input
                id="budget_min"
                type="number"
                step="0.01"
                value={formData.budget_range_min}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_range_min: e.target.value }))}
                placeholder="Minimum budget"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_max">Budget Range Max ($)</Label>
              <Input
                id="budget_max"
                type="number"
                step="0.01"
                value={formData.budget_range_max}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_range_max: e.target.value }))}
                placeholder="Maximum budget"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Preferred Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.customer_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_notes: e.target.value }))}
              placeholder="Any additional information or requirements"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
