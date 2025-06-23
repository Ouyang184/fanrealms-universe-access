
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, CreditCard, Lock, CheckCircle } from "lucide-react";

export default function Payments() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="text-white hover:bg-white/10 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-600 hover:bg-purple-700">
            Payment Information
          </Badge>
          <h1 className="text-5xl font-bold text-white mb-6">
            Secure & Transparent Payments
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            FanRealms is committed to providing secure, transparent payment processing 
            for all creators and subscribers. Learn how we handle your payments safely.
          </p>
        </div>

        {/* Stripe Integration */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Powered by Stripe</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              FanRealms uses Stripe, the world's leading payment processor, to handle all transactions 
              securely and reliably. Stripe is trusted by millions of businesses worldwide and maintains 
              the highest standards of security and compliance.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-400 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-2">PCI DSS Compliant</h3>
                  <p className="text-gray-300">All payment data is handled according to the highest security standards.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-400 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-2">Bank-Level Security</h3>
                  <p className="text-gray-300">Your financial information is protected with enterprise-grade encryption.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How Payments Work */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">How Payments Work</h2>
            </div>
            <div className="space-y-6">
              <div className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-xl font-bold text-white mb-2">For Subscribers</h3>
                <p className="text-gray-300 leading-relaxed">
                  When you subscribe to a creator, your payment is processed securely through Stripe. 
                  We never store your credit card information on our servers. All recurring subscriptions 
                  can be managed through your account settings or Stripe's customer portal.
                </p>
              </div>
              <div className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-xl font-bold text-white mb-2">For Creators</h3>
                <p className="text-gray-300 leading-relaxed">
                  Creators receive payments directly to their connected Stripe account. We take a small 
                  platform fee to maintain and improve FanRealms. Payouts are processed according to 
                  Stripe's standard schedule, typically 2-7 business days after a successful payment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Security */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="h-8 w-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Payment Security</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              Your payment security is our top priority. Here's how we protect your financial information:
            </p>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-1" />
                <span>All payment data is encrypted and transmitted securely using SSL/TLS protocols</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-1" />
                <span>We never store credit card numbers, CVV codes, or banking information</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-1" />
                <span>Two-factor authentication available for enhanced account security</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-1" />
                <span>Regular security audits and compliance monitoring</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-1" />
                <span>Fraud detection and prevention systems protect against unauthorized transactions</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Transparency */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Our Commitment to Transparency</h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              We believe in complete transparency about how payments work on FanRealms:
            </p>
            <div className="space-y-4 text-gray-300">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Platform Fees</h3>
                <p>We charge a small percentage fee on successful transactions to maintain and improve the platform.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Refund Policy</h3>
                <p>Refunds are handled according to our Terms of Service and may vary based on the type of content or subscription.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Dispute Resolution</h3>
                <p>Any payment disputes are handled promptly through our support team in partnership with Stripe's resolution process.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
