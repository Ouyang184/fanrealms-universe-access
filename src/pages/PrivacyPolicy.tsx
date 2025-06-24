
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Eye, Database, Users, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy Policy Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                At FanRealms, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, and protect your data when you use our platform.
              </p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Collection & Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Data Collected</h3>
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
                <h3 className="text-lg font-semibold mb-3">How We Use Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To provide services (payments, moderation).</li>
                  <li>To improve the Platform (bug fixes, UX enhancements).</li>
                  <li>For legal compliance (fraud prevention, subpoenas).</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">Data Sharing & Third Parties</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Creators see fan interactions (tips, subscriptions).</li>
                  <li>Payment processors (Stripe) handle transactions.</li>
                  <li>Cloud providers (Supabase) store data securely.</li>
                  <li>Legal authorities (if required by law).</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">User Rights (GDPR/CCPA)</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access/Delete Data:</strong> Email support@fanrealms.com</li>
                  <li><strong>Opt-Out (CCPA):</strong> Contact us for data deletion requests</li>
                  <li><strong>EU Users:</strong> Withdraw consent anytime</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">Data Retention & Security</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We retain data as long as necessary (or per legal requirements).</li>
                  <li>Encryption & firewalls protect sensitive data.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Your Data Protection Rights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Right to Access</h4>
                  <p className="text-muted-foreground">You have the right to request copies of your personal data.</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Right to Rectification</h4>
                  <p className="text-muted-foreground">You have the right to request correction of inaccurate or incomplete data.</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Right to Erasure</h4>
                  <p className="text-muted-foreground">You have the right to request deletion of your personal data under certain conditions.</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Right to Restrict Processing</h4>
                  <p className="text-muted-foreground">You have the right to request that we restrict the processing of your personal data.</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Right to Data Portability</h4>
                  <p className="text-muted-foreground">You have the right to request that we transfer your data to another organization.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Contact Us About Privacy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy or wish to exercise your data protection rights, 
                please contact our privacy team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" asChild>
                  <a href="mailto:privacy@fanrealms.com">Privacy Team</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="mailto:support@fanrealms.com">General Support</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
