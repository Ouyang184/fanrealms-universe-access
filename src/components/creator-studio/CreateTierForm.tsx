
import { TierFormDialog } from "./tier-form/TierFormDialog";

// Re-export the Tier interface for backward compatibility
export type { Tier } from "@/hooks/useTierForm";

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
