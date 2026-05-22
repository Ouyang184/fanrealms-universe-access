import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoadingPage from "./pages/Loading";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import RootLayout from "@/components/RootLayout";
import AuthGuard from "@/components/AuthGuard";
import AuthGate from "@/components/AuthGate";
import { MainLayout } from "@/components/Layout/MainLayout";

// Eager — first-paint / common landing routes. Keeping these eager avoids
// HMR fast-refresh "suspended while responding to synchronous input" errors.
import LandingPage from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Marketplace from "./pages/Marketplace";
import Jobs from "./pages/Jobs";
import Forum from "./pages/Forum";
import GamesPage from "./pages/Games";

// Lazy — split per route to keep cold loads small
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const SearchResultsPage = lazy(() => import("./pages/SearchResults"));
const Logout = lazy(() => import("./pages/Logout"));
const LogoutLoading = lazy(() => import("./pages/LogoutLoading"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Terms = lazy(() => import("./pages/Terms"));
const Support = lazy(() => import("./pages/Support"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const About = lazy(() => import("./pages/About"));
const Payments = lazy(() => import("./pages/Payments"));
const Security = lazy(() => import("./pages/Security"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CreatorGuidelines = lazy(() => import("./pages/CreatorGuidelines"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const ForumThread = lazy(() => import("./pages/ForumThread"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const DashboardAssetsPage = lazy(() => import("./pages/DashboardAssets"));
const DashboardAssetDetail = lazy(() => import("./pages/DashboardAssetDetail"));
const DashboardSalesPage = lazy(() => import("./pages/DashboardSales"));
const DashboardProjectsPage = lazy(() => import("./pages/DashboardProjects"));
const DashboardProjectNewPage = lazy(() => import("./pages/DashboardProjectNew"));
const DashboardProjectDetailPage = lazy(() => import("./pages/DashboardProjectDetail"));
const SellerProfilePage = lazy(() => import("./pages/SellerProfile"));
const LibraryPage = lazy(() => import("./pages/Library"));
const LibraryReviewsPage = lazy(() => import("./pages/LibraryReviews"));
const LibraryRecommendationsPage = lazy(() => import("./pages/LibraryRecommendations"));
const DashboardDevlogsPage = lazy(() => import("./pages/DashboardDevlogs"));
const DashboardDevlogEditPage = lazy(() => import("./pages/DashboardDevlogEdit"));
const JamPage = lazy(() => import("./pages/JamPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const CommissionPaymentPage = lazy(() => import("./pages/CommissionPaymentPage"));
const CommissionPaymentSuccess = lazy(() => import("./pages/CommissionPaymentSuccess"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const PurchaseSuccessPage = lazy(() => import("./pages/PurchaseSuccessPage"));
const SubscriptionsPage = lazy(() => import("./pages/Subscriptions"));




const CreatorRedirect = () => {
  const { username } = useParams();
  return <Navigate to={`/${username ?? ''}`} replace />;
};

// Redirect logged-in users from the landing page to the marketplace
const HomeRedirect = () => {
  const { user, authReady } = useAuth();
  if (!authReady) return null;
  // Logged-in users land on the marketplace — better first impression than
  // an empty library. Library is always reachable from the sidebar.
  if (user) return <Navigate to="/marketplace" replace />;
  return <LandingPage />;
};

const OAuthCallbackRedirector = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/auth/callback') return;

    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const hasOAuthPayload =
      searchParams.has('code') ||
      searchParams.has('error') ||
      searchParams.has('error_description') ||
      hashParams.has('access_token') ||
      hashParams.has('refresh_token') ||
      hashParams.has('error') ||
      hashParams.get('type') === 'recovery';

    if (!hasOAuthPayload) return;

    if (!searchParams.has('returnTo')) {
      searchParams.set('returnTo', '/library');
    }

    navigate(
      {
        pathname: '/auth/callback',
        search: `?${searchParams.toString()}`,
        hash: location.hash,
      },
      { replace: true }
    );
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
};

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
              <OAuthCallbackRedirector />
              <AuthGate>
              <Suspense fallback={<LoadingPage />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/:productId" element={<ProductDetail />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:jobId" element={<JobDetail />} />
                <Route path="/forum" element={<Forum />} />
                <Route path="/forum/:threadId" element={<ForumThread />} />
                <Route path="/jam/:jamId" element={<JamPage />} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/explore" element={<Navigate to="/marketplace" replace />} />
                <Route path="/explore/*" element={<Navigate to="/marketplace" replace />} />
                <Route path="/creator/:username" element={<CreatorRedirect />} />
                <Route path="/search" element={<SearchResultsPage />} />

                {/* Auth */}
                <Route
                  path="/login"
                  element={
                    <AuthGuard requireAuth={false} requireCompleteProfile={false}>
                      <Login />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <AuthGuard requireAuth={false} requireCompleteProfile={false}>
                      <Signup />
                    </AuthGuard>
                  }
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/complete-profile"
                  element={
                    <AuthGuard requireCompleteProfile={false}>
                      <CompleteProfile />
                    </AuthGuard>
                  }
                />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/logout/loading" element={<LogoutLoading />} />

                {/* Dashboard (protected) — uncomment as each page is built */}
                <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
                <Route path="/dashboard/assets" element={<AuthGuard><DashboardAssetsPage /></AuthGuard>} />
                <Route path="/dashboard/assets/:assetId" element={<AuthGuard><DashboardAssetDetail /></AuthGuard>} />
                <Route path="/dashboard/sales" element={<AuthGuard><DashboardSalesPage /></AuthGuard>} />
                <Route path="/dashboard/projects" element={<AuthGuard><DashboardProjectsPage /></AuthGuard>} />
                <Route path="/dashboard/projects/new" element={<AuthGuard><DashboardProjectNewPage /></AuthGuard>} />
                <Route path="/dashboard/projects/:projectId" element={<AuthGuard><DashboardProjectDetailPage /></AuthGuard>} />
                <Route path="/dashboard/upload" element={<AuthGuard><DashboardProjectNewPage /></AuthGuard>} />
                <Route path="/dashboard/devlogs" element={<AuthGuard><DashboardDevlogsPage /></AuthGuard>} />
                <Route path="/dashboard/devlogs/new" element={<AuthGuard><DashboardDevlogEditPage /></AuthGuard>} />
                <Route path="/dashboard/devlogs/:id/edit" element={<AuthGuard><DashboardDevlogEditPage /></AuthGuard>} />

                {/* Payment flows */}
                <Route path="/payment" element={<AuthGuard><PaymentPage /></AuthGuard>} />
                <Route path="/payment-success" element={<AuthGuard><PaymentSuccessPage /></AuthGuard>} />
                <Route path="/purchase-success" element={<AuthGuard><PurchaseSuccessPage /></AuthGuard>} />
                <Route path="/commissions/:id/pay" element={<AuthGuard><CommissionPaymentPage /></AuthGuard>} />
                <Route path="/commissions/:id/payment-success" element={<AuthGuard><CommissionPaymentSuccess /></AuthGuard>} />
                <Route path="/subscriptions" element={<AuthGuard><SubscriptionsPage /></AuthGuard>} />

                {/* Library (buyer side) */}
                <Route path="/library" element={<AuthGuard><LibraryPage /></AuthGuard>} />
                <Route path="/library/reviews" element={<AuthGuard><LibraryReviewsPage /></AuthGuard>} />
                <Route path="/library/recommendations" element={<AuthGuard><LibraryRecommendationsPage /></AuthGuard>} />

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
              </Suspense>
              </AuthGate>
              <Toaster />
            </RootLayout>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
