
import { Spinner } from "@/components/ui/spinner";

export function SettingsLoadingView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Creator Settings</h1>
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-6 w-6 mr-2" />
        <span>Loading settings...</span>
      </div>
    </div>
  );
}
