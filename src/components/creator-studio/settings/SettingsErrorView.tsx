
export function SettingsErrorView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Creator Settings</h1>
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load creator settings. Please try refreshing the page.</p>
      </div>
    </div>
  );
}
