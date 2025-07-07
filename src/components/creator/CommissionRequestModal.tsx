
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CommissionType } from '@/types/commission';
import { useCommissionRequestForm } from '@/hooks/useCommissionRequestForm';
import { CommissionRequestForm } from './CommissionRequestForm';

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
  const [open, setOpen] = useState(false);

  const {
    formData,
    setFormData,
    isSubmitting,
    handleSubmit,
    resetForm
  } = useCommissionRequestForm({
    commissionTypes,
    creatorId,
    specificCommissionType,
    onSuccess: () => setOpen(false)
  });

  const handleCancel = () => {
    resetForm();
    setOpen(false);
  };

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
        
        <CommissionRequestForm
          formData={formData}
          setFormData={setFormData}
          commissionTypes={commissionTypes}
          specificCommissionType={specificCommissionType}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
