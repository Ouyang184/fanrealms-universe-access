
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import RootLayout from "@/components/RootLayout";

// Import pages
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Home from '@/pages/Home';
import Feed from '@/pages/Feed';
import Following from '@/pages/Following';
import Explore from '@/pages/Explore';
import Messages from '@/pages/Messages';
import Settings from '@/pages/Settings';
import Creator from '@/pages/Creator';
import AuthCallback from '@/pages/AuthCallback';
import Terms from '@/pages/Terms';
import CookiePolicy from '@/pages/CookiePolicy';
import Profile from '@/pages/Profile';
import Subscriptions from '@/pages/Subscriptions';
import Payment from '@/pages/Payment';
import SearchResults from '@/pages/SearchResults';
import Preferences from '@/pages/Preferences';
import Onboarding from '@/pages/Onboarding';
import CompleteProfile from '@/pages/CompleteProfile';
import Purchases from '@/pages/Purchases';
import About from '@/pages/About';
import Payments from '@/pages/Payments';
import Security from '@/pages/Security';
import CommunityGuidelines from '@/pages/CommunityGuidelines';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import CreatorGuidelines from '@/pages/CreatorGuidelines';
import Help from '@/pages/Help';
import Contact from '@/pages/Contact';

// Creator Studio pages
import CreatorStudioDashboard from '@/pages/creator-studio/Dashboard';
import CreatorStudioPosts from '@/pages/creator-studio/Posts';
import CreatorStudioSettings from '@/pages/creator-studio/Settings';
import CreatorStudioMembershipTiers from '@/pages/creator-studio/MembershipTiers';
import CreatorStudioSubscribers from '@/pages/creator-studio/Subscribers';
import CreatorStudioPayouts from '@/pages/creator-studio/Payouts';
import CreatorStudioProfile from '@/pages/creator-studio/CreatorProfile';
import CreatorStudioNotifications from '@/pages/creator-studio/Notifications';

// Explore pages
import ExploreAll from '@/pages/ExploreAll';
import ExploreCategory from '@/pages/ExploreCategory';
import AllCreators from '@/pages/AllCreators';
import AllCreatorsExplore from '@/pages/AllCreatorsExplore';
import AllFeaturedCreators from '@/pages/AllFeaturedCreators';

import AuthGuard from '@/components/AuthGuard';
import NotFound from '@/pages/NotFound';
import Loading from '@/pages/Loading';
import AccountSettings from '@/pages/AccountSettings';
import Support from '@/pages/Support';
import Community from '@/pages/Community';
import MembershipTiers from '@/pages/MembershipTiers';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <RootLayout>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/about" element={<About />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/security" element={<Security />} />
              <Route path="/community-guidelines" element={<CommunityGuidelines />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/creator-guidelines" element={<CreatorGuidelines />} />
              <Route path="/help" element={<Help />} />
              <Route path="/contact" element={<Contact />} />

              {/* Protected routes */}
              <Route path="/home" element={<AuthGuard><Home /></AuthGuard>} />
              <Route path="/feed" element={<AuthGuard><Feed /></AuthGuard>} />
              <Route path="/following" element={<AuthGuard><Following /></AuthGuard>} />
              <Route path="/explore" element={<AuthGuard><Explore /></AuthGuard>} />
              <Route path="/explore/all" element={<AuthGuard><ExploreAll /></AuthGuard>} />
              <Route path="/explore/category/:category" element={<AuthGuard><ExploreCategory /></AuthGuard>} />
              <Route path="/explore/creators" element={<AuthGuard><AllCreatorsExplore /></AuthGuard>} />
              <Route path="/creators" element={<AuthGuard><AllCreators /></AuthGuard>} />
              <Route path="/creators/featured" element={<AuthGuard><AllFeaturedCreators /></AuthGuard>} />
              <Route path="/messages" element={<AuthGuard><Messages /></AuthGuard>} />
              <Route path="/notifications" element={<AuthGuard><CreatorStudioNotifications /></AuthGuard>} />
              <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
              <Route path="/account-settings" element={<AuthGuard><AccountSettings /></AuthGuard>} />
              <Route path="/preferences" element={<AuthGuard><Preferences /></AuthGuard>} />
              <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
              <Route path="/subscriptions" element={<AuthGuard><Subscriptions /></AuthGuard>} />
              <Route path="/purchases" element={<AuthGuard><Purchases /></AuthGuard>} />
              <Route path="/payment" element={<AuthGuard><Payment /></AuthGuard>} />
              <Route path="/search" element={<AuthGuard><SearchResults /></AuthGuard>} />
              <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
              <Route path="/complete-profile" element={<AuthGuard><CompleteProfile /></AuthGuard>} />
              <Route path="/support" element={<AuthGuard><Support /></AuthGuard>} />
              <Route path="/community" element={<AuthGuard><Community /></AuthGuard>} />
              <Route path="/membership-tiers" element={<AuthGuard><MembershipTiers /></AuthGuard>} />

              {/* Creator routes */}
              <Route path="/creator/:creatorIdentifier" element={<AuthGuard><Creator /></AuthGuard>} />

              {/* Creator Studio routes */}
              <Route path="/creator-studio/dashboard" element={<AuthGuard><CreatorStudioDashboard /></AuthGuard>} />
              <Route path="/creator-studio/posts" element={<AuthGuard><CreatorStudioPosts /></AuthGuard>} />
              <Route path="/creator-studio/messages" element={<AuthGuard><Messages /></AuthGuard>} />
              <Route path="/creator-studio/membership-tiers" element={<AuthGuard><CreatorStudioMembershipTiers /></AuthGuard>} />
              <Route path="/creator-studio/subscribers" element={<AuthGuard><CreatorStudioSubscribers /></AuthGuard>} />
              <Route path="/creator-studio/payouts" element={<AuthGuard><CreatorStudioPayouts /></AuthGuard>} />
              <Route path="/creator-studio/settings" element={<AuthGuard><CreatorStudioSettings /></AuthGuard>} />
              <Route path="/creator-studio/profile" element={<AuthGuard><CreatorStudioProfile /></AuthGuard>} />

              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </RootLayout>
  );
}

export default App;
