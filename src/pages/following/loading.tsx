
import { LoadingView } from "@/components/ui/loading-view";
import { MainLayout } from "@/components/main-layout";

export default function Loading() {
  return (
    <MainLayout>
      <LoadingView message="Loading creators you follow..." />
    </MainLayout>
  );
}
