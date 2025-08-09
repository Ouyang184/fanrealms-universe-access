import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { TagInput } from '@/components/tags/TagInput';

interface CommissionType {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  price_per_character?: number;
  price_per_revision?: number;
  estimated_turnaround_days: number;
  max_revisions: number;
  dos: string[];
  donts: string[];
  tags?: string[];
  sample_art_url?: string;
  is_active: boolean;
  created_at: string;
}

interface EditCommissionTypeModalProps {
  commissionType: CommissionType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditCommissionTypeModal({
  commissionType,
  open,
  onOpenChange,
  onSuccess,
}: EditCommissionTypeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: 0,
    price_per_character: 0,
    price_per_revision: 0,
    estimated_turnaround_days: 1,
    max_revisions: 3,
    sample_art_url: '',
    is_active: true,
  });
  const [dos, setDos] = useState<string[]>([]);
  const [donts, setDonts] = useState<string[]>([]);
const [currentDo, setCurrentDo] = useState('');
const [currentDont, setCurrentDont] = useState('');
const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (commissionType) {
      setFormData({
        name: commissionType.name,
        description: commissionType.description || '',
        base_price: commissionType.base_price,
        price_per_character: commissionType.price_per_character || 0,
        price_per_revision: commissionType.price_per_revision || 0,
        estimated_turnaround_days: commissionType.estimated_turnaround_days,
        max_revisions: commissionType.max_revisions,
        sample_art_url: commissionType.sample_art_url || '',
        is_active: commissionType.is_active,
      });
      setDos(commissionType.dos || []);
      setDonts(commissionType.donts || []);
      setTags(commissionType.tags || []);
    }
  }, [commissionType]);

  const addDo = () => {
    if (currentDo.trim() && !dos.includes(currentDo.trim())) {
      const newDos = [...dos, currentDo.trim()];
      setDos(newDos);
      setCurrentDo('');
    }
  };

  const addDont = () => {
    if (currentDont.trim() && !donts.includes(currentDont.trim())) {
      const newDonts = [...donts, currentDont.trim()];
      setDonts(newDonts);
      setCurrentDont('');
    }
  };

  const removeDo = (index: number) => {
    const newDos = dos.filter((_, i) => i !== index);
    setDos(newDos);
  };

  const removeDont = (index: number) => {
    const newDonts = donts.filter((_, i) => i !== index);
    setDonts(newDonts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commissionType) return;

    setIsSubmitting(true);
    try {
      const updateData = {
        name: formData.name,
        description: formData.description || null,
        base_price: formData.base_price,
        price_per_character: formData.price_per_character || null,
        price_per_revision: formData.price_per_revision || null,
        estimated_turnaround_days: formData.estimated_turnaround_days,
        max_revisions: formData.max_revisions,
        sample_art_url: formData.sample_art_url || null,
        is_active: formData.is_active,
        dos,
        donts,
        tags,
      };

      const { error } = await supabase
        .from('commission_types')
        .update(updateData)
        .eq('id', commissionType.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission type updated successfully"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating commission type:', error);
      toast({
        title: "Error",
        description: "Failed to update commission type",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!commissionType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Commission Type</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="sample_art_url">Sample Art URL</Label>
              <Input
                id="sample_art_url"
                type="url"
                value={formData.sample_art_url}
                onChange={(e) => setFormData({ ...formData, sample_art_url: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-semibold">Pricing & Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base_price">Base Price ($) *</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="estimated_turnaround_days">Turnaround Days *</Label>
                <Input
                  id="estimated_turnaround_days"
                  type="number"
                  min="1"
                  value={formData.estimated_turnaround_days}
                  onChange={(e) => setFormData({ ...formData, estimated_turnaround_days: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="max_revisions">Max Revisions *</Label>
                <Input
                  id="max_revisions"
                  type="number"
                  min="0"
                  value={formData.max_revisions}
                  onChange={(e) => setFormData({ ...formData, max_revisions: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="price_per_revision">Price per Extra Revision ($)</Label>
                <Input
                  id="price_per_revision"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_per_revision}
                  onChange={(e) => setFormData({ ...formData, price_per_revision: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="price_per_character">Price per Character ($)</Label>
                <Input
                  id="price_per_character"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_per_character || ''}
                  onChange={(e) => setFormData({ ...formData, price_per_character: e.target.value ? parseFloat(e.target.value) : 0 })}
                  placeholder="2.50"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <TagInput
              tags={tags}
              onTagsChange={setTags}
              maxTags={10}
              placeholder="Add tags (e.g., portrait, anime)"
            />
          </div>

          {/* Will Do List */}
          <div>
            <Label>Will Do</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentDo}
                onChange={(e) => setCurrentDo(e.target.value)}
                placeholder="Add what you will do..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDo())}
              />
              <Button type="button" onClick={addDo} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {dos.map((item, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {item}
                  <button
                    type="button"
                    onClick={() => removeDo(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Won't Do List */}
          <div>
            <Label>Won't Do</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentDont}
                onChange={(e) => setCurrentDont(e.target.value)}
                placeholder="Add what you won't do..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDont())}
              />
              <Button type="button" onClick={addDont} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {donts.map((item, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {item}
                  <button
                    type="button"
                    onClick={() => removeDont(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Commission Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}