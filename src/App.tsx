import LandingPage from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/contexts/AuthContext";
import LoadingPage from "./pages/Loading";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import RootLayout from "@/components/RootLayout";
import AuthGuard from "@/components/AuthGuard";
import SearchResultsPage from "./pages/SearchResults";
import Logout from "./pages/Logout";
import LogoutLoading from "./pages/LogoutLoading";
import AccountSettings from "./pages/AccountSettings";
import { MainLayout } from "@/components/Layout/MainLayout";
import Terms from "./pages/Terms";
import Support from "./pages/Support";
import CookiePolicy from "./pages/CookiePolicy";
import About from "./pages/About";
import Payments from "./pages/Payments";
import Security from "./pages/Security";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CreatorGuidelines from "./pages/CreatorGuidelines";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Forum from "./pages/Forum";
import ForumThread from "./pages/ForumThread";
import GamesPage from "./pages/Games";
// New pages — will be uncommented as each is built in subsequent tasks
// import DashboardPage from "./pages/Dashboard";
// import DashboardAssetsPage from "./pages/DashboardAssets";
// import DashboardSalesPage from "./pages/DashboardSales";
import SellerProfilePage from "./pages/SellerProfile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'online',
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <RootLayout>
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/:productId" element={<ProductDetail />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:jobId" element={<JobDetail />} />
                <Route path="/forum" element={<Forum />} />
                <Route path="/forum/:threadId" element={<ForumThread />} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/search" element={<SearchResultsPage />} />

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/logout/loading" element={<LogoutLoading />} />

                {/* Dashboard (protected) — uncomment as each page is built */}
                {/* <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} /> */}
                {/* <Route path="/dashboard/assets" element={<AuthGuard><DashboardAssetsPage /></AuthGuard>} /> */}
                {/* <Route path="/dashboard/sales" element={<AuthGuard><DashboardSalesPage /></AuthGuard>} /> */}
                <Route path="/dashboard" element={<Navigate to="/marketplace" replace />} />
                <Route path="/home" element={<Navigate to="/dashboard" replace />} />

                {/* Settings */}
                <Route path="/settings" element={<AuthGuard><MainLayout><AccountSettings /></MainLayout></AuthGuard>} />

                {/* Legal */}
                <Route path="/terms" element={<Terms />} />
                <Route path="/help" element={<Support />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/about" element={<About />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/security" element={<Security />} />
                <Route path="/community-guidelines" element={<CommunityGuidelines />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/creator-guidelines" element={<CreatorGuidelines />} />

                <Route path="/loading" element={<LoadingPage />} />

                {/* Seller profile — /:username catch-all, must be second-to-last */}
                <Route path="/:username" element={<SellerProfilePage />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </RootLayout>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
