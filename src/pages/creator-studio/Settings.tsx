
import { useCreatorSettingsQuery } from "@/hooks/useCreatorSettingsQuery";
import { SettingsHeader } from "@/components/creator-studio/settings/SettingsHeader";
import { SettingsForm } from "@/components/creator-studio/settings/SettingsForm";
import { SettingsLoadingView } from "@/components/creator-studio/settings/SettingsLoadingView";
import { SettingsErrorView } from "@/components/creator-studio/settings/SettingsErrorView";

export default function CreatorStudioSettings() {
  const { settings, isLoading } = useCreatorSettingsQuery();

  if (isLoading) {
    return <SettingsLoadingView />;
  }

  if (!settings) {
    return <SettingsErrorView />;
  }

  return (
    <div className="space-y-6">
      <SettingsHeader />
      <SettingsForm />
    </div>
  );
}
