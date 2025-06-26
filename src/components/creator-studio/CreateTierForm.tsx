
import { TierFormDialog } from "./tier-form/TierFormDialog";

interface CreateTierFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTier?: any | null;
}

export function CreateTierForm({ isOpen, onClose, editingTier }: CreateTierFormProps) {
  return (
    <TierFormDialog 
      isOpen={isOpen} 
      onClose={onClose} 
      editingTier={editingTier} 
    />
  );
}
