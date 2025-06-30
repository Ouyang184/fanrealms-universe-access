
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface SaveButtonProps {
  onSave: () => void;
  isLoading?: boolean;
  hasChanges?: boolean;
}

export function SaveButton({ onSave, isLoading = false, hasChanges = false }: SaveButtonProps) {
  console.log('SaveButton render:', { hasChanges, isLoading });
  
  // Always show the button but disable it when no changes
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        onClick={onSave}
        disabled={isLoading || !hasChanges}
        className={`shadow-lg transition-all duration-200 ${
          hasChanges 
            ? 'bg-purple-600 hover:bg-purple-700 scale-100' 
            : 'bg-gray-400 cursor-not-allowed scale-95 opacity-60'
        }`}
        size="lg"
      >
        <Save className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? "Saving..." : hasChanges ? "Save Changes" : "No Changes"}
      </Button>
    </div>
  );
}
