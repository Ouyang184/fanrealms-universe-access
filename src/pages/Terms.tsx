
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, FileText, Users, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Terms() {
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
          <h1 className="text-4xl font-bold mb-4">Terms of Service & Privacy Policy</h1>
          <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                1. Introduction & Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                By accessing or using FanRealms ("the Platform"), you agree to comply with these Terms of Service (ToS) and our Privacy Policy. If you do not agree, you must immediately cease using the Platform.
              </p>
            </CardContent>
          </Card>

          {/* Eligibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                2. Eligibility & Account Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">2.1 Age Requirement</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You must be at least 18 years of age to create NSFW content.</li>
                  <li>In jurisdictions where the legal age of consent differs, you must comply with local laws.</li>
                  <li>We do not knowingly allow underage users and will terminate accounts and report illegal activity if discovered.</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">2.2 Account Security</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You are responsible for maintaining confidential login credentials.</li>
                  <li>You must notify us immediately of unauthorized access.</li>
                  <li>We reserve the right to suspend or terminate accounts suspected of fraudulent activity.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                3. User Responsibilities & Prohibited Conduct
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">3.1 Permitted Use</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>The Platform is for legally permissible content (e.g., artistic, educational, or adult content where allowed).</li>
                  <li>Users must comply with all applicable laws (local, national, and international).</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">3.2 Prohibited Content & Behavior</h3>
                <p className="mb-3">You may not use the Platform to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Posting inappropriate content (child exploitation, revenge porn, terrorism-related material), if any inappropriate content are reported, it will be immediately deleted.</li>
                  <li>Engage in fraud, phishing, or scams.</li>
                  <li>Harass, dox, or threaten others.</li>
                  <li>Distribute malware, spam, or pirated material.</li>
                  <li>Circumvent payment systems (e.g., chargebacks, off-platform transactions).</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">3.3 Content Ownership & Licensing</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Creators retain ownership of their content but grant the Platform a non-exclusive license to distribute it.</li>
                  <li>Subscribers may not redistribute paid content without permission.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                4. Payments, Fees & Refunds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">4.1 Subscription & Tipping</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Subscribers pay creators by the use of stripe, stripe and the Platform deducts a service fee.</li>
                  <li>Recurring subscriptions auto-renew unless canceled.</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">4.2 Refund Policy</h3>
                <div className="space-y-3">
                  <p>No refunds for voluntary transactions.</p>
                  <p><strong>Exceptions:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Unauthorized payments (report within 7 days).</li>
                    <li>Undelivered content (after 14 days of non-delivery).</li>
                  </ul>
                  <p>Chargebacks will result in account suspension.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Copyright */}
          <Card>
            <CardHeader>
              <CardTitle>5. Copyright & DMCA Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">5.1 Copyright Infringement Claims</h3>
                <div className="space-y-3">
                  <p>We comply with the Digital Millennium Copyright Act (DMCA).</p>
                  <p>To file a takedown request, submit:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>A physical or electronic signature of the copyright owner.</li>
                    <li>Identification of the infringing material.</li>
                    <li>Contact information.</li>
                    <li>A statement of good faith belief that the use is unauthorized.</li>
                  </ul>
                  <p>Submit claims to: legal@fanrealms.com</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">5.2 Counter-Notification</h3>
                <p>If content is wrongly removed, you may submit a counter-notice under penalty of perjury.</p>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>6. Termination & Suspension</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-2">
                <li>We may terminate accounts for violations without refunds.</li>
                <li>Users may appeal bans via support@fanrealms.com</li>
              </ul>
            </CardContent>
          </Card>

          {/* Dispute Resolution */}
          <Card>
            <CardHeader>
              <CardTitle>7. Dispute Resolution & Governing Law</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Governing Law:</strong> These terms are governed by United States federal and state law.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle>8. Privacy Policy (Detailed Breakdown)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">8.1 Data Collected</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-3 text-left">Category</th>
                        <th className="border border-border p-3 text-left">Examples</th>
                        <th className="border border-border p-3 text-left">Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border p-3">Account Data</td>
                        <td className="border border-border p-3">Email, username, age verification</td>
                        <td className="border border-border p-3">User authentication</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3">Payment Data</td>
                        <td className="border border-border p-3">Card details (via Stripe)</td>
                        <td className="border border-border p-3">Transaction processing</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3">Content Data</td>
                        <td className="border border-border p-3">Posts, messages, media</td>
                        <td className="border border-border p-3">Platform functionality</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3">Usage Data</td>
                        <td className="border border-border p-3">IP, cookies, device info</td>
                        <td className="border border-border p-3">Analytics & security</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">8.2 How We Use Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To provide services (payments, moderation).</li>
                  <li>To improve the Platform (bug fixes, UX enhancements).</li>
                  <li>For legal compliance (fraud prevention, subpoenas).</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">8.3 Data Sharing & Third Parties</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Creators see fan interactions (tips, subscriptions).</li>
                  <li>Payment processors (Stripe) handle transactions.</li>
                  <li>Cloud providers (Supabase) store data securely.</li>
                  <li>Legal authorities (if required by law).</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">8.4 User Rights (GDPR/CCPA)</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access/Delete Data:</strong> Email support@fanrealms.com</li>
                  <li><strong>Opt-Out (CCPA):</strong> Contact us for data deletion requests</li>
                  <li><strong>EU Users:</strong> Withdraw consent anytime</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">8.5 Data Retention & Security</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We retain data as long as necessary (or per legal requirements).</li>
                  <li>Encryption & firewalls protect sensitive data.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
