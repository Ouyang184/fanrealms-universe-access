
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Creator from "./pages/Creator";
import Messages from "./pages/Messages";
import Subscriptions from "./pages/Subscriptions";
import Requests from "./pages/Requests";
import CommissionPaymentSuccess from "./pages/CommissionPaymentSuccess";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import Payments from "./pages/Payments";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/creator/:id" element={<Creator />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/commission-payment-success" element={<CommissionPaymentSuccess />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payments" element={<Payments />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
