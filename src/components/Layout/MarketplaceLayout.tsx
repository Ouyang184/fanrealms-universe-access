import { ReactNode } from "react";
import { MarketplaceTopNav } from "@/components/marketplace/MarketplaceTopNav";
import { Footer } from "@/components/Layout/Footer";

interface MarketplaceLayoutProps {
  children: ReactNode;
}

export function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketplaceTopNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
