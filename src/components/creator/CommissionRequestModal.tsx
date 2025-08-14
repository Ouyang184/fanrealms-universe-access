
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CommissionType } from '@/types/commission';
import { useCommissionRequestForm } from '@/hooks/useCommissionRequestForm';
import { CommissionRequestForm } from './CommissionRequestForm';
import { useExistingCommissionCheck } from '@/hooks/useExistingCommissionCheck';
import { useDraftStorage } from '@/hooks/useDraftStorage';
import { useAuth } from '@/contexts/AuthContext';
import { ExistingRequestDialog } from './ExistingRequestDialog';
import { Button } from '@/components/ui/button';
import { FileText, Clock } from 'lucide-react';

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
  const [showExistingDialog, setShowExistingDialog] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  
  // Check for existing commission requests
  const { data: existingCheck, isLoading: isCheckingExisting } = useExistingCommissionCheck(
    specificCommissionType?.id || '',
    creatorId
  );
  
  // Check for draft data
  const { loadDraft, clearDraft, getDraftInfo } = useDraftStorage(
    creatorId,
    specificCommissionType?.id || '',
    user?.id
  );

  const {
    formData,
    setFormData,
    isSubmitting,
    handleSubmit,
    resetForm,
    loadDraftData,
    draftExists
  } = useCommissionRequestForm({
    commissionTypes,
    creatorId,
    specificCommissionType,
    onSuccess: () => setOpen(false),
    enableAutoSave: true
  });

  // Handle opening the modal with smart logic
  const handleOpenModal = () => {
    if (isCheckingExisting) return;
    
    // Check for existing requests first
    if (existingCheck?.hasExisting && existingCheck.actionType !== 'new') {
      setShowExistingDialog(true);
      return;
    }
    
    // Check for draft data
    const draftInfo = getDraftInfo();
    if (draftInfo.exists) {
      setShowDraftDialog(true);
      return;
    }
    
    // No conflicts, open normally
    setOpen(true);
  };

  const handleCreateNew = () => {
    resetForm();
    setOpen(true);
  };

  const handleLoadDraft = () => {
    const draft = loadDraft();
    if (draft) {
      loadDraftData(draft);
    }
    setShowDraftDialog(false);
    setOpen(true);
  };

  const handleCancel = () => {
    resetForm();
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild onClick={handleOpenModal}>
          {children}
        </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="commission-request-description">
        <DialogHeader>
          <DialogTitle>
            {specificCommissionType 
              ? `Request: ${specificCommissionType.name}` 
              : 'Request Commission'
            }
          </DialogTitle>
          <DialogDescription id="commission-request-description">
            {specificCommissionType 
              ? `Submit a request for ${specificCommissionType.name} commission. Fill out the form below with your requirements.`
              : 'Submit a commission request to this creator. Choose a commission type and provide your requirements.'
            }
          </DialogDescription>
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

    {/* Existing Request Dialog */}
    {existingCheck && (
      <ExistingRequestDialog
        open={showExistingDialog}
        onOpenChange={setShowExistingDialog}
        checkResult={existingCheck}
        onCreateNew={handleCreateNew}
      />
    )}

    {/* Draft Dialog */}
    <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Draft Found</DialogTitle>
          <DialogDescription>
            You have an unsaved draft for this commission request. Would you like to continue where you left off?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Button onClick={handleLoadDraft} className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Continue with Draft
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              clearDraft();
              setShowDraftDialog(false);
              setOpen(true);
            }}
            className="w-full"
          >
            Start Fresh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
