
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Upload, X, Image } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface CreateCommissionTypeModalProps {
  children: React.ReactNode;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
  base_price: number;
  estimated_turnaround_days: number;
  max_revisions: number;
  price_per_revision?: number;
  dos: string[];
  donts: string[];
  sample_art_url?: string;
}

export function CreateCommissionTypeModal({ children, onSuccess }: CreateCommissionTypeModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dos, setDos] = useState<string[]>([]);
  const [donts, setDonts] = useState<string[]>([]);
  const [currentDo, setCurrentDo] = useState('');
  const [currentDont, setCurrentDont] = useState('');
  const [sampleImage, setSampleImage] = useState<File | null>(null);
  const [sampleImagePreview, setSampleImagePreview] = useState<string | null>(null);
  const [uploadingSample, setUploadingSample] = useState(false);

  const { creatorProfile } = useCreatorProfile();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSampleImage(file);
      const preview = URL.createObjectURL(file);
      setSampleImagePreview(preview);
    }
  };

  const removeSampleImage = () => {
    setSampleImage(null);
    setSampleImagePreview(null);
  };

  const uploadSampleImage = async (): Promise<string | null> => {
    if (!sampleImage || !creatorProfile?.id) return null;

    setUploadingSample(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = sampleImage.name.split('.').pop();
      const fileName = `commission-sample-${creatorProfile.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/commission-samples/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-attachments')
        .upload(filePath, sampleImage);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('post-attachments')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading sample image:', error);
      toast({
        title: "Error",
        description: "Failed to upload sample image",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingSample(false);
    }
  };

  const addDo = () => {
    if (currentDo.trim() && !dos.includes(currentDo.trim())) {
      setDos([...dos, currentDo.trim()]);
      setCurrentDo('');
    }
  };

  const addDont = () => {
    if (currentDont.trim() && !donts.includes(currentDont.trim())) {
      setDonts([...donts, currentDont.trim()]);
      setCurrentDont('');
    }
  };

  const removeDo = (index: number) => {
    setDos(dos.filter((_, i) => i !== index));
  };

  const removeDont = (index: number) => {
    setDonts(donts.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    if (!creatorProfile?.id) {
      toast({
        title: "Error",
        description: "Creator profile not found",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload sample image first if provided
      let sampleArtUrl = null;
      if (sampleImage) {
        sampleArtUrl = await uploadSampleImage();
      }

      const commissionData = {
        creator_id: creatorProfile.id,
        name: data.name,
        description: data.description,
        base_price: data.base_price,
        estimated_turnaround_days: data.estimated_turnaround_days,
        max_revisions: data.max_revisions,
        price_per_revision: data.price_per_revision || null,
        dos,
        donts,
        sample_art_url: sampleArtUrl,
        is_active: true
      };

      const { error } = await supabase
        .from('commission_types')
        .insert([commissionData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission type created successfully"
      });

      reset();
      setDos([]);
      setDonts([]);
      setSampleImage(null);
      setSampleImagePreview(null);
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating commission type:', error);
      toast({
        title: "Error",
        description: "Failed to create commission type",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Sample Art Upload */}
          <div>
            <Label>Sample Art</Label>
            <div className="mt-2">
              {sampleImagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={sampleImagePreview}
                    alt="Sample art preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    onClick={removeSampleImage}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    variant="destructive"
                    size="sm"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="sample-upload"
                  />
                  <label
                    htmlFor="sample-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Image className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload sample art
                    </span>
                    <span className="text-xs text-gray-500">
                      JPG, PNG up to 10MB
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

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
                {...register('price_per_revision')}
                placeholder="10.00"
              />
            </div>
          </div>

          {/* Will Do Section */}
          <div>
            <Label>Will Do</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={currentDo}
                onChange={(e) => setCurrentDo(e.target.value)}
                placeholder="Add something you will do..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDo())}
              />
              <Button type="button" onClick={addDo} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {dos.map((item, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {item}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeDo(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Won't Do Section */}
          <div>
            <Label>Won't Do</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={currentDont}
                onChange={(e) => setCurrentDont(e.target.value)}
                placeholder="Add something you won't do..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDont())}
              />
              <Button type="button" onClick={addDont} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {donts.map((item, index) => (
                <Badge key={index} variant="destructive" className="flex items-center gap-1">
                  {item}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeDont(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

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
              onClick={() => setOpen(false)}
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
