
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import RootLayout from "@/components/RootLayout";
import { ProtectedLayout } from "@/components/Layout/ProtectedLayout";

// Import pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Home from '@/pages/Home';
import Feed from '@/pages/Feed';
import Following from '@/pages/Following';
import Explore from '@/pages/Explore';
import Messages from '@/pages/Messages';
import Settings from '@/pages/Settings';
import Creator from '@/pages/Creator';
import Dashboard from '@/pages/Dashboard';
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
              <Route path="/" element={<Index />} />
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

              {/* Protected routes with layout */}
              <Route path="/home" element={<ProtectedLayout><Home /></ProtectedLayout>} />
              <Route path="/feed" element={<ProtectedLayout><Feed /></ProtectedLayout>} />
              <Route path="/following" element={<ProtectedLayout><Following /></ProtectedLayout>} />
              <Route path="/explore" element={<ProtectedLayout><Explore /></ProtectedLayout>} />
              <Route path="/explore/all" element={<ProtectedLayout><ExploreAll /></ProtectedLayout>} />
              <Route path="/explore/category/:category" element={<ProtectedLayout><ExploreCategory /></ProtectedLayout>} />
              <Route path="/explore/creators" element={<ProtectedLayout><AllCreatorsExplore /></ProtectedLayout>} />
              <Route path="/creators" element={<ProtectedLayout><AllCreators /></ProtectedLayout>} />
              <Route path="/creators/featured" element={<ProtectedLayout><AllFeaturedCreators /></ProtectedLayout>} />
              <Route path="/messages" element={<ProtectedLayout><Messages /></ProtectedLayout>} />
              <Route path="/notifications" element={<ProtectedLayout><CreatorStudioNotifications /></ProtectedLayout>} />
              <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
              <Route path="/account-settings" element={<ProtectedLayout><AccountSettings /></ProtectedLayout>} />
              <Route path="/preferences" element={<ProtectedLayout><Preferences /></ProtectedLayout>} />
              <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
              <Route path="/subscriptions" element={<ProtectedLayout><Subscriptions /></ProtectedLayout>} />
              <Route path="/purchases" element={<ProtectedLayout><Purchases /></ProtectedLayout>} />
              <Route path="/payment" element={<ProtectedLayout><Payment /></ProtectedLayout>} />
              <Route path="/search" element={<ProtectedLayout><SearchResults /></ProtectedLayout>} />
              <Route path="/onboarding" element={<ProtectedLayout><Onboarding /></ProtectedLayout>} />
              <Route path="/complete-profile" element={<ProtectedLayout><CompleteProfile /></ProtectedLayout>} />
              <Route path="/support" element={<ProtectedLayout><Support /></ProtectedLayout>} />
              <Route path="/community" element={<ProtectedLayout><Community /></ProtectedLayout>} />
              <Route path="/membership-tiers" element={<ProtectedLayout><MembershipTiers /></ProtectedLayout>} />

              {/* Creator routes */}
              <Route path="/creator/:creatorIdentifier" element={<ProtectedLayout><Creator /></ProtectedLayout>} />

              {/* Creator Studio routes */}
              <Route path="/creator-studio/dashboard" element={<ProtectedLayout><CreatorStudioDashboard /></ProtectedLayout>} />
              <Route path="/creator-studio/posts" element={<ProtectedLayout><CreatorStudioPosts /></ProtectedLayout>} />
              <Route path="/creator-studio/messages" element={<ProtectedLayout><Messages /></ProtectedLayout>} />
              <Route path="/creator-studio/membership-tiers" element={<ProtectedLayout><CreatorStudioMembershipTiers /></ProtectedLayout>} />
              <Route path="/creator-studio/subscribers" element={<ProtectedLayout><CreatorStudioSubscribers /></ProtectedLayout>} />
              <Route path="/creator-studio/payouts" element={<ProtectedLayout><CreatorStudioPayouts /></ProtectedLayout>} />
              <Route path="/creator-studio/settings" element={<ProtectedLayout><CreatorStudioSettings /></ProtectedLayout>} />
              <Route path="/creator-studio/profile" element={<ProtectedLayout><CreatorStudioProfile /></ProtectedLayout>} />

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
