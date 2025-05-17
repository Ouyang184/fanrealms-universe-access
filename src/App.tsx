
import LandingPage from "./pages/Landing";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import OnboardingPage from "./pages/Onboarding";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import LoadingPage from "./pages/Loading";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "./pages/Home";
import { TooltipProvider } from "@/components/ui/tooltip";
import SubscriptionsPage from "./pages/Subscriptions";
import RootLayout from "@/components/RootLayout";
import FeedPage from "./pages/Feed";
import FollowingPage from "./pages/Following";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import ExplorePage from "./pages/Explore";
import Logout from "./pages/Logout";
import LogoutLoading from "./pages/LogoutLoading";
import MembershipTiersPage from "./pages/MembershipTiers";
import CreatorStudioTiers from "./pages/creator-studio/MembershipTiers";
import AccountSettings from "./pages/AccountSettings";
import { MainLayout } from "@/components/Layout/MainLayout";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Use the correct syntax for enabling suspense mode in React Query v5+
      networkMode: 'online',
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <RootLayout>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/index" element={<Index />} />
                
                {/* Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/logout/loading" element={<LogoutLoading />} />
                
                {/* Main app routes with MainLayout */}
                <Route path="/home" element={<MainLayout><HomePage /></MainLayout>} />
                <Route path="/feed" element={<MainLayout><FeedPage /></MainLayout>} />
                <Route path="/explore" element={<MainLayout><ExplorePage /></MainLayout>} />
                <Route path="/subscriptions" element={<MainLayout><SubscriptionsPage /></MainLayout>} />
                <Route path="/following" element={<MainLayout><FollowingPage /></MainLayout>} />
                <Route path="/messages" element={<MainLayout><Messages /></MainLayout>} />
                <Route path="/notifications" element={<MainLayout><Notifications /></MainLayout>} />
                <Route path="/settings" element={<MainLayout><AccountSettings /></MainLayout>} />
                <Route path="/membership-tiers" element={<MainLayout><MembershipTiersPage /></MainLayout>} />
                <Route path="/dashboard" element={<Navigate to="/home" replace />} />
                
                {/* Creator studio routes with MainLayout */}
                <Route path="/creator-studio/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
                <Route path="/creator-studio/posts" element={<MainLayout><Dashboard /></MainLayout>} />
                <Route path="/creator-studio/messages" element={<MainLayout><Dashboard /></MainLayout>} />
                <Route path="/creator-studio/membership-tiers" element={<MainLayout><CreatorStudioTiers /></MainLayout>} />
                <Route path="/creator-studio/subscribers" element={<MainLayout><Dashboard /></MainLayout>} />
                <Route path="/creator-studio/payouts" element={<MainLayout><Dashboard /></MainLayout>} />
                <Route path="/creator-studio/settings" element={<MainLayout><Dashboard /></MainLayout>} />
                
                <Route path="/loading" element={<LoadingPage />} />
              </Routes>
              <Toaster />
            </RootLayout>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
