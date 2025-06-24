
import { LoadingView } from "@/components/ui/loading-view";
import { MainLayout } from "@/components/Layout/MainLayout";

export default function Loading() {
  return (
    <MainLayout>
      <LoadingView message="Loading creators you follow..." />
    </MainLayout>
  );
}
