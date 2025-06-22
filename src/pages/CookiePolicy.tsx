
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function CookiePolicy() {
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
          <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="space-y-8">
          {/* What are cookies */}
          <Card>
            <CardHeader>
              <CardTitle>What are cookies?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Cookies are small text files that are placed on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences, 
                keeping you logged in, and understanding how you use our platform.
              </p>
            </CardContent>
          </Card>

          {/* Essential Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Essential Cookies (Always Active)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground mb-4">
                These cookies are necessary for FanRealms to function properly and cannot be disabled:
              </p>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">Authentication Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    Store your login session and keep you signed in securely across page visits.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Security Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    Protect your account from unauthorized access and maintain session security.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Age Verification Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    Remember your age verification status for NSFW content compliance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Functional Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Functional Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground mb-4">
                These cookies enhance your experience on FanRealms:
              </p>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">Theme Preferences</h4>
                  <p className="text-sm text-muted-foreground">
                    Remember whether you prefer dark or light mode.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Content Filtering Preferences</h4>
                  <p className="text-sm text-muted-foreground">
                    Store your NSFW content visibility settings and content preferences.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">UI Customization</h4>
                  <p className="text-sm text-muted-foreground">
                    Remember sidebar states, notification preferences, and other interface settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground mb-4">
                We use trusted third-party services that may set their own cookies:
              </p>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">Stripe Payment Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Secure payment processing and subscription management. Required for all financial transactions.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Supabase Infrastructure</h4>
                  <p className="text-sm text-muted-foreground">
                    Backend authentication and data management services that power FanRealms.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What we don't use */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-300">What We Don't Use</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                FanRealms does not use targeting, advertising, or tracking cookies. We do not share 
                your browsing data with advertising networks or use cookies for marketing purposes.
              </p>
            </CardContent>
          </Card>

          {/* Managing Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Managing Your Cookie Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Browser Settings</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  You can control cookies through your browser settings. However, disabling essential 
                  cookies may affect your ability to use FanRealms properly.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Account Settings</h4>
                <p className="text-sm text-muted-foreground">
                  You can adjust content preferences and notification settings in your account settings 
                  when logged in.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Questions About Cookies?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <a href="mailto:legal@fanrealms.com" className="text-primary hover:underline">
                  legal@fanrealms.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
