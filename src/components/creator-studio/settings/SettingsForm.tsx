
import { Button } from "@/components/ui/button";
import { ProfileInfoForm } from "@/components/creator-studio/settings/ProfileInfoForm";
import { BannerSection } from "@/components/creator-studio/settings/BannerSection";
import { SocialLinksSection } from "@/components/creator-studio/settings/SocialLinksSection";
import { Spinner } from "@/components/ui/spinner";
import { useSettingsForm } from "@/hooks/useSettingsForm";

export function SettingsForm() {
  const {
    settings,
    formData,
    isSaving,
    isUploading,
    handleChange,
    handleSave,
    handleImageUpload,
    handleBannerUpdate,
    user
  } = useSettingsForm();

  const isFormDisabled = isUploading;

  return (
    <form onSubmit={handleSave}>
      <div className="space-y-6">
        <ProfileInfoForm 
          settings={formData} 
          onSettingsChange={handleChange} 
          onImageUpload={handleImageUpload}
          isUploading={isUploading}
        />
        
        <BannerSection 
          userId={user?.id || ''} 
          currentBannerUrl={formData?.banner_url} 
          onBannerUpdate={handleBannerUpdate}
        />
        
        {settings?.id && (
          <SocialLinksSection creatorId={settings.id} />
        )}
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isFormDisabled || isSaving}
            className="min-w-[140px]"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
