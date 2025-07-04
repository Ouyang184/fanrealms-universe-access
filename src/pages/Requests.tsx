
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { RequestsTab } from "@/components/user/RequestsTab";

export default function Requests() {
  const { isChecking, user } = useAuthCheck();
  
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
          <div className="space-y-8 p-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Commission Requests</h1>
              <p className="text-muted-foreground">Manage your commission requests and view submissions</p>
            </div>
            
            <RequestsTab />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
