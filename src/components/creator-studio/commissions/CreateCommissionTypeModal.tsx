
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCommissionTypeForm } from '@/hooks/useCommissionTypeForm';
import { useSampleImageUpload } from '@/hooks/useSampleImageUpload';
import { SampleImageUpload } from './SampleImageUpload';
import { DosList, DontsList } from './DosDontsList';

interface CreateCommissionTypeModalProps {
  children: React.ReactNode;
  onSuccess: () => void;
}

export function CreateCommissionTypeModal({ children, onSuccess }: CreateCommissionTypeModalProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    dos,
    donts,
    currentDo,
    currentDont,
    setCurrentDo,
    setCurrentDont,
    addDo,
    addDont,
    removeDo,
    removeDont,
    onSubmit,
    resetForm,
    creatorProfile
  } = useCommissionTypeForm(() => {
    setOpen(false);
    onSuccess();
  });

  const {
    sampleImagePreview,
    uploadingSample,
    handleImageUpload,
    removeSampleImage,
    uploadSampleImage,
    resetImageUpload
  } = useSampleImageUpload();

  const handleFormSubmit = async (data: any) => {
    // Upload sample image first if provided
    let sampleArtUrl = null;
    if (creatorProfile?.id) {
      sampleArtUrl = await uploadSampleImage(creatorProfile.id);
    }

    await onSubmit(data, sampleArtUrl);
    resetImageUpload();
  };

  const handleModalClose = () => {
    resetForm();
    resetImageUpload();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Commission Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Name is required' })}
                placeholder="e.g., Character Portrait"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="base_price">Base Price ($) *</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                {...register('base_price', { 
                  required: 'Base price is required',
                  min: { value: 1, message: 'Price must be at least $1' }
                })}
                placeholder="50.00"
              />
              {errors.base_price && (
                <p className="text-sm text-red-600">{errors.base_price.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe what this commission type includes..."
              rows={3}
            />
          </div>

          <SampleImageUpload
            sampleImagePreview={sampleImagePreview}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeSampleImage}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="estimated_turnaround_days">Turnaround (days) *</Label>
              <Input
                id="estimated_turnaround_days"
                type="number"
                {...register('estimated_turnaround_days', { 
                  required: 'Turnaround time is required',
                  min: { value: 1, message: 'Must be at least 1 day' }
                })}
                placeholder="7"
              />
              {errors.estimated_turnaround_days && (
                <p className="text-sm text-red-600">{errors.estimated_turnaround_days.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="max_revisions">Max Revisions *</Label>
              <Input
                id="max_revisions"
                type="number"
                {...register('max_revisions', { 
                  required: 'Max revisions is required',
                  min: { value: 0, message: 'Cannot be negative' }
                })}
                placeholder="3"
              />
              {errors.max_revisions && (
                <p className="text-sm text-red-600">{errors.max_revisions.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="price_per_revision">Price per Extra Revision ($)</Label>
              <Input
                id="price_per_revision"
                type="number"
                step="0.01"
                min="0"
                {...register('price_per_revision')}
                placeholder="10.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="price_per_character">Price per Character ($)</Label>
            <Input
              id="price_per_character"
              type="number"
              step="0.01"
              min="0"
              {...register('price_per_character')}
              placeholder="2.50"
            />
          </div>

          <DosList
            dos={dos}
            currentDo={currentDo}
            onCurrentDoChange={setCurrentDo}
            onAddDo={addDo}
            onRemoveDo={removeDo}
          />

          <DontsList
            donts={donts}
            currentDont={currentDont}
            onCurrentDontChange={setCurrentDont}
            onAddDont={addDont}
            onRemoveDont={removeDont}
          />

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || uploadingSample}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Create Commission Type'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleModalClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
