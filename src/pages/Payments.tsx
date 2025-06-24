
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CreditCard, Lock, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";

export default function Payments() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Payment Information
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Complete transparency on how FanRealms handles your payments with industry-leading security.
          </p>
        </div>

        {/* Stripe Integration */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-blue-600" />
              Powered by Stripe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg leading-relaxed">
                FanRealms uses <strong>Stripe</strong> as our payment processor, the same trusted platform used by companies like Amazon, Google, and Spotify. Stripe is a PCI DSS Level 1 certified service provider, which is the highest level of certification available in the payments industry.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Secure Processing</h4>
                    <p className="text-sm text-muted-foreground">All payments are encrypted and processed through Stripe's secure servers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">No Card Storage</h4>
                    <p className="text-sm text-muted-foreground">FanRealms never stores your credit card information</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Global Coverage</h4>
                    <p className="text-sm text-muted-foreground">Accepts payments from 135+ countries and territories</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Fraud Protection</h4>
                    <p className="text-sm text-muted-foreground">Advanced machine learning prevents fraudulent transactions</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Accepted Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <h4 className="font-medium mb-2">Credit & Debit Cards</h4>
                <p className="text-sm text-muted-foreground">Visa, Mastercard, American Express, Discover, JCB, Diners Club</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">$</span>
                </div>
                <h4 className="font-medium mb-2">Digital Wallets</h4>
                <p className="text-sm text-muted-foreground">Apple Pay, Google Pay, Microsoft Pay</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">ACH</span>
                </div>
                <h4 className="font-medium mb-2">Bank Transfers</h4>
                <p className="text-sm text-muted-foreground">Direct bank transfers and ACH payments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-600" />
              Security & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  End-to-End Encryption
                </h4>
                <p className="text-muted-foreground">All payment data is encrypted using AES-256 encryption, both in transit and at rest.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">PCI DSS Compliance</h4>
                <p className="text-muted-foreground">Stripe maintains the highest level of payment card industry data security standards.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">3D Secure Authentication</h4>
                <p className="text-muted-foreground">Additional layer of security for online card payments, reducing fraud and chargebacks.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Regular Security Audits</h4>
                <p className="text-muted-foreground">Stripe undergoes regular third-party security audits and penetration testing.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transparency Notice */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              Important Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Processing Fees</h4>
                <p className="text-muted-foreground">
                  Stripe charges standard processing fees (typically 2.9% + 30¢ for US cards). 
                  These fees are deducted before funds reach creators' accounts.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Payout Schedule</h4>
                <p className="text-muted-foreground">
                  Creator payouts are processed according to Stripe's standard schedule, 
                  typically 2-7 business days depending on your bank and location.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Dispute Resolution</h4>
                <p className="text-muted-foreground">
                  All payment disputes are handled through Stripe's secure dispute resolution process. 
                  Both creators and subscribers are protected under Stripe's policies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help with Payments?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              If you have questions about payments, billing, or need assistance with a transaction, 
              our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" asChild>
                <a href="mailto:payments@fanrealms.com">Contact Payment Support</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                  Stripe Privacy Policy
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
