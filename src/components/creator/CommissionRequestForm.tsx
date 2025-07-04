
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { CommissionType } from '@/types/commission';
import { CommissionTypeDisplay } from './CommissionTypeDisplay';

interface FormData {
  commission_type_id: string;
  title: string;
  description: string;
  budget_range_min: string;
  budget_range_max: string;
  deadline: string;
  customer_notes: string;
}

interface CommissionRequestFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  commissionTypes: CommissionType[];
  specificCommissionType?: CommissionType;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

export function CommissionRequestForm({
  formData,
  setFormData,
  commissionTypes,
  specificCommissionType,
  isSubmitting,
  onSubmit,
  onCancel
}: CommissionRequestFormProps) {
  const selectedType = specificCommissionType || commissionTypes.find(type => type.id === formData.commission_type_id);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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

      {selectedType && !specificCommissionType && (
        <CommissionTypeDisplay commissionType={selectedType} />
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Request
        </Button>
      </div>
    </form>
  );
}
