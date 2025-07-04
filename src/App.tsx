import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import Explore from './pages/Explore';
import Feed from './pages/Feed';
import Following from './pages/Following';
import Messages from './pages/Messages';
import Purchases from './pages/Purchases';
import NotFound from './pages/NotFound';
import CreatorStudio from './pages/CreatorStudio';
import CreatorProfile from './pages/CreatorProfile';
import PostDetails from './pages/PostDetails';
import CommissionDetails from './pages/CommissionDetails';
import CommissionPay from './pages/CommissionPay';
import { ThemeProvider } from "@/components/ui/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Requests from "@/pages/Requests";

function App() {
  return (
    <Router>
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <Toaster />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/following" element={<Following />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/creator/:creatorId" element={<CreatorProfile />} />
              <Route path="/posts/:postId" element={<PostDetails />} />
              <Route path="/commissions/:commissionId" element={<CommissionDetails />} />
              <Route path="/commissions/:commissionId/pay" element={<CommissionPay />} />
              <Route path="/creator-studio" element={<CreatorStudio />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
