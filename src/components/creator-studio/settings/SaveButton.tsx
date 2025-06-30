
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface SaveButtonProps {
  onSave: () => void;
  isLoading?: boolean;
  hasChanges?: boolean;
}

export function SaveButton({ onSave, isLoading = false, hasChanges = false }: SaveButtonProps) {
  if (!hasChanges) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        onClick={onSave}
        disabled={isLoading}
        className="bg-purple-600 hover:bg-purple-700 shadow-lg"
        size="lg"
      >
        <Save className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
