
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Info } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Payment Authorization Process</h4>
            <p className="text-sm text-blue-700">
              Your payment will be authorized (not charged) when you submit this request. 
              Funds are held securely by Stripe until the creator accepts your commission. 
              If rejected or no response within 7 days, you'll be automatically refunded.
            </p>
          </div>
        </div>
      </div>

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

        <div className="space-y-2">
          <Label htmlFor="deadline">Preferred Deadline (Optional)</Label>
          <input
            id="deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating Request...' : 'Authorize Payment & Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
}
