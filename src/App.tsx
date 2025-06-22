import LandingPage from "./pages/Landing";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import OnboardingPage from "./pages/Onboarding";
import PreferencesPage from "./pages/Preferences";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "./pages/creator-studio/Dashboard";
import LoadingPage from "./pages/Loading";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "./pages/Home";
import { TooltipProvider } from "@/components/ui/tooltip";
import SubscriptionsPage from "./pages/Subscriptions";
import RootLayout from "@/components/RootLayout";
import FeedPage from "./pages/Feed";
import FollowingPage from "./pages/Following";
import Notifications from "./pages/creator-studio/Notifications";
import Messages from "./pages/Messages";
import ExplorePage from "./pages/Explore";
import ExploreCategoryPage from "./pages/ExploreCategory";
import SearchResultsPage from "./pages/SearchResults";
import Logout from "./pages/Logout";
import LogoutLoading from "./pages/LogoutLoading";
import MembershipTiersPage from "./pages/MembershipTiers";
import CreatorStudioTiers from "./pages/creator-studio/MembershipTiers";
import AccountSettings from "./pages/AccountSettings";
import { MainLayout } from "@/components/Layout/MainLayout";
import CreatorPostsPage from "./pages/creator-studio/Posts";
import { CreatorCheck } from "@/components/creator-studio/CreatorCheck";
import CreatorStudioSubscribers from "./pages/creator-studio/Subscribers";
import CreatorStudioPayouts from "./pages/creator-studio/Payouts";
import CreatorStudioSettings from "./pages/creator-studio/Settings";
import CreatorPage from "./pages/Creator";
import CreatorProfile from "./pages/creator-studio/CreatorProfile";
import PaymentPage from "./pages/Payment";
import Terms from "./pages/Terms";
import AllFeaturedCreatorsPage from "./pages/AllFeaturedCreators";
import AllCreatorsPage from "./pages/AllCreators";
import AllCreatorsExplorePage from "./pages/AllCreatorsExplore";
import Support from "./pages/Support";

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
                <Route path="/home" element={<HomePage />} />
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/following" element={<FollowingPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/explore/all" element={<AllCreatorsExplorePage />} />
                <Route path="/explore/featured" element={<AllFeaturedCreatorsPage />} />
                <Route path="/explore/:category" element={<ExploreCategoryPage />} />
                
                {/* Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/logout/loading" element={<LogoutLoading />} />
                
                {/* Legal and support pages */}
                <Route path="/terms" element={<Terms />} />
                <Route path="/help" element={<Support />} />
                
                {/* Payment route */}
                <Route path="/payment" element={<PaymentPage />} />
                
                {/* Creator profile page */}
                <Route path="/creator/:id" element={<CreatorPage />} />
                
                {/* Main app routes */}
                <Route path="/dashboard" element={<Navigate to="/home" replace />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/messages" element={<MainLayout><Messages /></MainLayout>} />
                
                {/* Settings page */}
                <Route path="/settings" element={<MainLayout><AccountSettings /></MainLayout>} />
                
                <Route path="/membership-tiers" element={<MainLayout><MembershipTiersPage /></MainLayout>} />
                
                {/* Creator studio routes - All wrapped with CreatorCheck */}
                <Route path="/creator-studio/dashboard" element={
                  <MainLayout>
                    <CreatorCheck>
                      <Dashboard />
                    </CreatorCheck>
                  </MainLayout>
                } />
                <Route path="/creator-studio/posts" element={
                  <CreatorCheck>
                    <CreatorPostsPage />
                  </CreatorCheck>
                } />
                <Route path="/creator-studio/notifications" element={
                  <MainLayout>
                    <CreatorCheck>
                      <Notifications />
                    </CreatorCheck>
                  </MainLayout>
                } />
                <Route path="/creator-studio/membership-tiers" element={
                  <MainLayout>
                    <CreatorCheck>
                      <CreatorStudioTiers />
                    </CreatorCheck>
                  </MainLayout>
                } />
                <Route path="/creator-studio/subscribers" element={
                  <MainLayout>
                    <CreatorCheck>
                      <CreatorStudioSubscribers />
                    </CreatorCheck>
                  </MainLayout>
                } />
                <Route path="/creator-studio/payouts" element={
                  <MainLayout>
                    <CreatorCheck>
                      <CreatorStudioPayouts />
                    </CreatorCheck>
                  </MainLayout>
                } />
                <Route path="/creator-studio/settings" element={
                  <MainLayout>
                    <CreatorCheck>
                      <CreatorStudioSettings />
                    </CreatorCheck>
                  </MainLayout>
                } />
                <Route path="/creator-studio/creator-profile" element={
                  <MainLayout>
                    <CreatorCheck>
                      <CreatorProfile />
                    </CreatorCheck>
                  </MainLayout>
                } />
                
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
