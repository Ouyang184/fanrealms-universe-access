
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, HelpCircle, Shield, FileQuestion, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Help() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Determine the back link based on authentication status
  const backToLink = user ? '/home' : '/';
  const backToText = user ? 'Back to Home' : 'Back to Home';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-muted-foreground">Get the support you need for FanRealms</p>
        </div>

        <div className="space-y-8">
          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Quick Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Link to="/support" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <h3 className="font-semibold mb-2">Contact Support</h3>
                  <p className="text-sm text-muted-foreground">Get direct help from our support team</p>
                </Link>
                <Link to="/community-guidelines" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <h3 className="font-semibold mb-2">Community Guidelines</h3>
                  <p className="text-sm text-muted-foreground">Learn about our community rules</p>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Sections */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Account & Getting Started</h3>
                <div className="space-y-2">
                  <details className="border rounded p-3">
                    <summary className="font-medium cursor-pointer">How do I create an account?</summary>
                    <p className="mt-2 text-sm text-muted-foreground">Click "Sign Up" and follow the registration process. You'll need to verify your email address.</p>
                  </details>
                  <details className="border rounded p-3">
                    <summary className="font-medium cursor-pointer">I forgot my password. How do I reset it?</summary>
                    <p className="mt-2 text-sm text-muted-foreground">Use the "Forgot Password" link on the login page to receive a password reset email.</p>
                  </details>
                  <details className="border rounded p-3">
                    <summary className="font-medium cursor-pointer">How do I update my profile?</summary>
                    <p className="mt-2 text-sm text-muted-foreground">Go to Settings from your profile menu to update your information and preferences.</p>
                  </details>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">Subscriptions & Payments</h3>
                <div className="space-y-2">
                  <details className="border rounded p-3">
                    <summary className="font-medium cursor-pointer">How do I subscribe to a creator?</summary>
                    <p className="mt-2 text-sm text-muted-foreground">Visit a creator's profile and click "Subscribe" to choose a membership tier.</p>
                  </details>
                  <details className="border rounded p-3">
                    <summary className="font-medium cursor-pointer">How do I cancel my subscription?</summary>
                    <p className="mt-2 text-sm text-muted-foreground">Go to your Subscriptions page to manage or cancel your active subscriptions.</p>
                  </details>
                  <details className="border rounded p-3">
                    <summary className="font-medium cursor-pointer">What payment methods do you accept?</summary>
                    <p className="mt-2 text-sm text-muted-foreground">We accept all major credit and debit cards through our secure Stripe payment system.</p>
                  </details>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">For Creators</h3>
                <div className="space-y-2">
                  <details className="border rounded p-3">
                    <summary className="font-medium cursor-pointer">How do I become a creator?</summary>
                    <p className="mt-2 text-sm text-muted-foreground">Visit the Creator Studio to set up your creator profile and start posting content.</p>
                  </details>
                  <details className="border rounded p-3">
                    <summary className="font-medium cursor-pointer">How do I set up membership tiers?</summary>
                    <p className="mt-2 text-sm text-muted-foreground">In Creator Studio, go to Membership Tiers to create different subscription levels for your fans.</p>
                  </details>
                  <details className="border rounded p-3">
                    <summary className="font-medium cursor-pointer">When do I get paid?</summary>
                    <p className="mt-2 text-sm text-muted-foreground">Payments are processed through Stripe and typically arrive 2-7 business days after a successful transaction.</p>
                  </details>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Still Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you can't find the answer you're looking for, our support team is here to help.
              </p>
              <Link to="/support">
                <Button>Contact Support</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
