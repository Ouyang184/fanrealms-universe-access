import { TopNav } from "./TopNav/TopNav";

interface MainLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function MainLayout({ children, fullWidth = false }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fafafa] text-foreground flex flex-col">
      <TopNav />
      <main className="flex-1 w-full">
        <div
          className={
            fullWidth
              ? "w-full px-4 sm:px-6 py-6 sm:py-8"
              : "max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8"
          }
        >
          {children}
        </div>
      </main>
    </div>
  );
}
