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
import AuthGuard from "@/components/AuthGuard";
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
import Commissions from "./pages/creator-studio/Commissions";
import PaymentPage from "./pages/Payment";
import Terms from "./pages/Terms";
import AllFeaturedCreatorsPage from "./pages/AllFeaturedCreators";
import AllCreatorsPage from "./pages/AllCreators";
import AllCreatorsExplorePage from "./pages/AllCreatorsExplore";
import AllCommissionsPage from "./pages/AllCommissions";
import Support from "./pages/Support";
import CookiePolicy from "./pages/CookiePolicy";
import About from "./pages/About";
import Payments from "./pages/Payments";
import Security from "./pages/Security";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CreatorGuidelines from "./pages/CreatorGuidelines";
import ShareablePost from "./pages/ShareablePost";
import CompleteProfile from "./pages/CompleteProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CommissionPayment from "./pages/CommissionPayment";
import CommissionPaymentSuccess from "./pages/CommissionPaymentSuccess";
import Requests from "./pages/Requests";


// Create a client
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
                <Route path="/" element={<LandingPage />} />
                <Route path="/index" element={<Index />} />
                <Route path="/home" element={<AuthGuard><HomePage /></AuthGuard>} />
                <Route path="/feed" element={<AuthGuard><FeedPage /></AuthGuard>} />
                <Route path="/following" element={<AuthGuard><FollowingPage /></AuthGuard>} />
                <Route path="/explore" element={<AuthGuard><ExplorePage /></AuthGuard>} />
                <Route path="/explore/all" element={<AuthGuard><AllCreatorsExplorePage /></AuthGuard>} />
                <Route path="/explore/featured" element={<AuthGuard><AllFeaturedCreatorsPage /></AuthGuard>} />
                <Route path="/explore/:category" element={<AuthGuard><ExploreCategoryPage /></AuthGuard>} />
                <Route path="/commissions" element={<AuthGuard><AllCommissionsPage /></AuthGuard>} />
                
                {/* Auth routes - moved higher in priority */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/logout/loading" element={<LogoutLoading />} />
                
                {/* Legal and support pages */}
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
                
                {/* Payment route */}
                <Route path="/payment" element={<AuthGuard><PaymentPage /></AuthGuard>} />
                
                {/* Direct post route - must come before creator profile route */}
                <Route path="/post/:postId" element={<ShareablePost />} />
                
                {/* Shareable post route with creator slug - must be before creator profile route */}
                <Route path="/:creatorSlug/posts/:postId" element={<ShareablePost />} />
                
                {/* Creator profile page */}
                <Route path="/creator/:id" element={<CreatorPage />} />
                
                {/* Main app routes - All using MainLayout for consistency */}
                <Route path="/dashboard" element={<Navigate to="/home" replace />} />
                <Route path="/subscriptions" element={<AuthGuard><SubscriptionsPage /></AuthGuard>} />
                <Route path="/requests" element={<AuthGuard><MainLayout><Requests /></MainLayout></AuthGuard>} />
                <Route path="/messages" element={<AuthGuard><MainLayout><Messages /></MainLayout></AuthGuard>} />
                <Route path="/settings" element={<AuthGuard><MainLayout><AccountSettings /></MainLayout></AuthGuard>} />
                
                <Route path="/membership-tiers" element={<AuthGuard><MainLayout><MembershipTiersPage /></MainLayout></AuthGuard>} />
                
                {/* Creator studio routes - All wrapped with CreatorCheck and MainLayout */}
                <Route path="/creator-studio/dashboard" element={
                  <AuthGuard>
                    <MainLayout>
                      <CreatorCheck>
                        <Dashboard />
                      </CreatorCheck>
                    </MainLayout>
                  </AuthGuard>
                } />
                <Route path="/creator-studio/posts" element={
                  <AuthGuard>
                    <MainLayout>
                      <CreatorCheck>
                        <CreatorPostsPage />
                      </CreatorCheck>
                    </MainLayout>
                  </AuthGuard>
                } />
                <Route path="/creator-studio/notifications" element={
                  <AuthGuard>
                    <MainLayout>
                      <CreatorCheck>
                        <Notifications />
                      </CreatorCheck>
                    </MainLayout>
                  </AuthGuard>
                } />
                <Route path="/creator-studio/membership-tiers" element={
                  <AuthGuard>
                    <MainLayout>
                      <CreatorCheck>
                        <CreatorStudioTiers />
                      </CreatorCheck>
                    </MainLayout>
                  </AuthGuard>
                } />
                <Route path="/creator-studio/subscribers" element={
                  <AuthGuard>
                    <MainLayout>
                      <CreatorCheck>
                        <CreatorStudioSubscribers />
                      </CreatorCheck>
                    </MainLayout>
                  </AuthGuard>
                } />
                <Route path="/creator-studio/payouts" element={
                  <AuthGuard>
                    <MainLayout>
                      <CreatorCheck>
                        <CreatorStudioPayouts />
                      </CreatorCheck>
                    </MainLayout>
                  </AuthGuard>
                } />
                <Route path="/creator-studio/commissions" element={
                  <AuthGuard>
                    <MainLayout>
                      <CreatorCheck>
                        <Commissions />
                      </CreatorCheck>
                    </MainLayout>
                  </AuthGuard>
                } />
                <Route path="/creator-studio/settings" element={
                  <AuthGuard>
                    <MainLayout>
                      <CreatorCheck>
                        <CreatorStudioSettings />
                      </CreatorCheck>
                    </MainLayout>
                  </AuthGuard>
                } />
                <Route path="/creator-studio/profile" element={
                  <AuthGuard>
                    <MainLayout>
                      <CreatorCheck>
                        <CreatorProfile />
                      </CreatorCheck>
                    </MainLayout>
                  </AuthGuard>
                } />
                <Route path="/creator-studio/creator-profile" element={
                  <AuthGuard>
                    <MainLayout>
                      <CreatorCheck>
                        <CreatorProfile />
                      </CreatorCheck>
                    </MainLayout>
                  </AuthGuard>
                } />
                
                {/* Commission payment routes - add before creator profile route */}
                <Route path="/commissions/:requestId/pay" element={<AuthGuard><CommissionPayment /></AuthGuard>} />
                <Route path="/commissions/:requestId/payment-success" element={<AuthGuard><CommissionPaymentSuccess /></AuthGuard>} />
                
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
