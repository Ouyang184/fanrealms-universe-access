
import { Button } from "@/components/ui/button";
import { Loader, Globe, Lock } from "lucide-react";

interface PostFormActionsProps {
  isLoading: boolean;
  selectedTierIds: string[] | null;
  willBeNSFW: boolean;
  onCancel: () => void;
}

export function PostFormActions({ 
  isLoading, 
  selectedTierIds, 
  willBeNSFW, 
  onCancel 
}: PostFormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isLoading} className="min-w-[120px]">
        {isLoading ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Publishing...
          </>
        ) : (
          <>
            {selectedTierIds && selectedTierIds.length > 0 ? (
              <Lock className="mr-2 h-4 w-4" />
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            Publish {selectedTierIds && selectedTierIds.length > 0 ? "Premium" : "Public"} Post
            {willBeNSFW && " (18+)"}
          </>
        )}
      </Button>
    </div>
  );
}
