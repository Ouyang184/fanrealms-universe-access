
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, HelpCircle, Shield, FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Support() {
  const { user } = useAuth();

  // Determine the back link based on authentication status
  const backToLink = user ? '/home' : '/';
  const backToText = user ? 'Back to Home' : 'Back to Home';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link to={backToLink} className="text-primary hover:underline mb-4 inline-block">
            ← {backToText}
          </Link>
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-muted-foreground">Get the support you need for FanRealms</p>
        </div>

        <div className="space-y-8">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">General Support</h3>
                <p className="text-muted-foreground mb-2">
                  For account issues, technical problems, or general questions about FanRealms:
                </p>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:support@fanrealms.com" className="text-primary hover:underline">
                    support@fanrealms.com
                  </a>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">Legal & Copyright</h3>
                <p className="text-muted-foreground mb-2">
                  For legal matters, DMCA takedown requests, or copyright issues:
                </p>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:legal@fanrealms.com" className="text-primary hover:underline">
                    legal@fanrealms.com
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Common Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Common Support Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Account & Billing</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Account registration issues</li>
                    <li>• Payment and subscription problems</li>
                    <li>• Profile settings help</li>
                    <li>• Account recovery</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Content & Safety</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Reporting inappropriate content</li>
                    <li>• Content moderation questions</li>
                    <li>• Creator verification</li>
                    <li>• Platform guidelines</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Time Notice */}
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Response Time</h3>
                <p className="text-muted-foreground">
                  We typically respond to support inquiries within 24-48 hours. For urgent matters, please clearly mark your email as "URGENT" in the subject line.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
