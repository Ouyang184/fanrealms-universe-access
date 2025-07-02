
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Upload, X } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CommissionBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  commissionTypeId: string | null;
}

export function CommissionBookingModal({ 
  isOpen, 
  onClose, 
  creatorId, 
  commissionTypeId 
}: CommissionBookingModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setReferenceImages(prev => [...prev, ...files].slice(0, 5)); // Max 5 images
    }
  };

  const removeImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to request a commission.",
        variant: "destructive"
      });
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and description for your commission.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload reference images if any
      const uploadedImageUrls: string[] = [];
      
      for (const file of referenceImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post-attachments')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post-attachments')
          .getPublicUrl(uploadData.path);
          
        uploadedImageUrls.push(publicUrl);
      }

      // Create commission request
      const { error } = await supabase
        .from('commission_requests')
        .insert({
          customer_id: user.id,
          creator_id: creatorId,
          commission_type_id: commissionTypeId,
          title: title.trim(),
          description: description.trim(),
          reference_images: uploadedImageUrls
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Commission Requested",
        description: "Your commission request has been sent to the creator. They will review it shortly.",
      });

      // Reset form
      setTitle('');
      setDescription('');
      setReferenceImages([]);
      onClose();

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Commission</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Commission Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Character portrait of my OC"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description & Requirements</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed information about what you want commissioned..."
              rows={6}
              required
            />
          </div>

          <div>
            <Label>Reference Images (Optional)</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-md hover:bg-secondary/80 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Upload Images</span>
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </Label>
                <span className="text-xs text-muted-foreground">
                  Max 5 images
                </span>
              </div>
              
              {referenceImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {referenceImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner />
                  <span className="ml-2">Submitting...</span>
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
