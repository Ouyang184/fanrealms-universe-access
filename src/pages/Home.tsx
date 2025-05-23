
import { MainLayout } from "@/components/Layout/MainLayout";
import { HomeContent } from "@/components/home/HomeContent";

export default function HomePage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        <HomeContent />
      </div>
    </MainLayout>
  );
}
