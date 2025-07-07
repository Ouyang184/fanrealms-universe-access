
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionEventProvider } from "@/contexts/SubscriptionEventContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Creator from "./pages/Creator";
import Post from "./pages/Post";
import Messages from "./pages/Messages";
import Subscriptions from "./pages/Subscriptions";
import Notifications from "./pages/Notifications";
import Requests from "./pages/Requests";
import CommissionPaymentSuccess from "./pages/CommissionPaymentSuccess";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import Payments from "./pages/Payments";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionEventProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/creator/:id" element={<Creator />} />
              <Route path="/post/:id" element={<Post />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/commission-payment-success" element={<CommissionPaymentSuccess />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payments" element={<Payments />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SubscriptionEventProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
