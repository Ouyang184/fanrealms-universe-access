
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Check, Shield, FileText, Users, CreditCard, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TermsModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function TermsModal({ open, onAccept, onDecline }: TermsModalProps) {
  const [finalAgreement, setFinalAgreement] = useState<boolean>(false);

  const handleAcceptContinue = () => {
    if (finalAgreement) {
      onAccept();
    } else {
      onDecline();
    }
  };

  const handleDownloadPDF = () => {
    // Create a simple PDF-like content by opening a new window with printable content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>FanRealms - Terms of Service & Privacy Policy</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #555; margin-top: 30px; }
            h3 { color: #777; margin-top: 20px; }
            ul { margin: 10px 0; }
            li { margin: 5px 0; }
            .section { margin: 30px 0; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>FanRealms - Terms of Service & Privacy Policy</h1>
          <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
          
          <div class="section">
            <h2>1. Introduction & Acceptance of Terms</h2>
            <p>By accessing or using FanRealms ("the Platform"), you agree to comply with these Terms of Service (ToS) and our Privacy Policy. If you do not agree, you must immediately cease using the Platform.</p>
          </div>

          <div class="section">
            <h2>2. Eligibility & Account Registration</h2>
            <h3>2.1 Age Requirement</h3>
            <ul>
              <li>You must be at least 18 years old to use the Platform.</li>
              <li>In jurisdictions where the legal age of consent differs, you must comply with local laws.</li>
              <li>We do not knowingly allow underage users and will terminate accounts and report illegal activity if discovered.</li>
            </ul>
            
            <h3>2.2 Account Security</h3>
            <ul>
              <li>You are responsible for maintaining confidential login credentials.</li>
              <li>You must notify us immediately of unauthorized access.</li>
              <li>We reserve the right to suspend or terminate accounts suspected of fraudulent activity.</li>
            </ul>
          </div>

          <div class="section">
            <h2>3. User Responsibilities & Prohibited Conduct</h2>
            <h3>3.1 Permitted Use</h3>
            <ul>
              <li>The Platform is for legally permissible content (e.g., artistic, educational, or adult content where allowed).</li>
              <li>Users must comply with all applicable laws (local, national, and international).</li>
            </ul>
            
            <h3>3.2 Prohibited Content & Behavior</h3>
            <p>You may not use the Platform to:</p>
            <ul>
              <li>Post illegal content (child exploitation, revenge porn, terrorism-related material).</li>
              <li>Engage in fraud, phishing, or scams.</li>
              <li>Harass, dox, or threaten others.</li>
              <li>Distribute malware, spam, or pirated material.</li>
              <li>Circumvent payment systems (e.g., chargebacks, off-platform transactions).</li>
            </ul>

            <h3>3.3 Content Ownership & Licensing</h3>
            <ul>
              <li>Creators retain ownership of their content but grant the Platform a non-exclusive license to distribute it.</li>
              <li>Fans may not redistribute paid content without permission.</li>
            </ul>
          </div>

          <div class="section">
            <h2>4. Payments, Fees & Refunds</h2>
            <h3>4.1 Subscription & Tipping</h3>
            <ul>
              <li>Fans pay creators directly, and the Platform deducts a service fee.</li>
              <li>Recurring subscriptions auto-renew unless canceled.</li>
            </ul>
            
            <h3>4.2 Refund Policy</h3>
            <p>No refunds for voluntary transactions.</p>
            <p><strong>Exceptions:</strong></p>
            <ul>
              <li>Unauthorized payments (report within 7 days).</li>
              <li>Undelivered content (after 14 days of non-delivery).</li>
            </ul>
            <p>Chargebacks will result in account suspension.</p>
          </div>

          <div class="section">
            <h2>5. Copyright & DMCA Compliance</h2>
            <h3>5.1 Copyright Infringement Claims</h3>
            <p>We comply with the Digital Millennium Copyright Act (DMCA).</p>
            <p>To file a takedown request, submit:</p>
            <ul>
              <li>A physical or electronic signature of the copyright owner.</li>
              <li>Identification of the infringing material.</li>
              <li>Contact information.</li>
              <li>A statement of good faith belief that the use is unauthorized.</li>
            </ul>
            <p>Submit claims to: legal@fanrealms.com</p>
            
            <h3>5.2 Counter-Notification</h3>
            <p>If content is wrongly removed, you may submit a counter-notice under penalty of perjury.</p>
          </div>

          <div class="section">
            <h2>6. Termination & Suspension</h2>
            <ul>
              <li>We may terminate accounts for violations without refunds.</li>
              <li>Users may appeal bans via support@fanrealms.com</li>
            </ul>
          </div>

          <div class="section">
            <h2>7. Dispute Resolution & Governing Law</h2>
            <ul>
              <li><strong>Arbitration Clause:</strong> Disputes must be resolved via binding arbitration (not class action).</li>
              <li><strong>Governing Law:</strong> These terms are governed by United States law.</li>
            </ul>
          </div>

          <div class="section">
            <h2>8. Privacy Policy (Detailed Breakdown)</h2>
            <h3>8.1 Data Collected</h3>
            <table>
              <tr><th>Category</th><th>Examples</th><th>Purpose</th></tr>
              <tr><td>Account Data</td><td>Email, username, age verification</td><td>User authentication</td></tr>
              <tr><td>Payment Data</td><td>Card details (via Stripe/PayPal)</td><td>Transaction processing</td></tr>
              <tr><td>Content Data</td><td>Posts, messages, media</td><td>Platform functionality</td></tr>
              <tr><td>Usage Data</td><td>IP, cookies, device info</td><td>Analytics & security</td></tr>
            </table>
            
            <h3>8.2 How We Use Data</h3>
            <ul>
              <li>To provide services (payments, moderation).</li>
              <li>To improve the Platform (bug fixes, UX enhancements).</li>
              <li>For legal compliance (fraud prevention, subpoenas).</li>
            </ul>
            
            <h3>8.3 Data Sharing & Third Parties</h3>
            <ul>
              <li>Creators see fan interactions (tips, subscriptions).</li>
              <li>Payment processors (Stripe, PayPal) handle transactions.</li>
              <li>Cloud providers (AWS, Google Cloud) store data securely.</li>
              <li>Legal authorities (if required by law).</li>
            </ul>
            
            <h3>8.4 User Rights (GDPR/CCPA)</h3>
            <ul>
              <li><strong>Access/Delete Data:</strong> Email support@fanrealms.com</li>
              <li><strong>Opt-Out (CCPA):</strong> Contact us for data deletion requests</li>
              <li><strong>EU Users:</strong> Withdraw consent anytime</li>
            </ul>
            
            <h3>8.5 Data Retention & Security</h3>
            <ul>
              <li>We retain data as long as necessary (or per legal requirements).</li>
              <li>Encryption & firewalls protect sensitive data.</li>
            </ul>
          </div>

          <div class="section">
            <h2>9. Final Consent & Agreement</h2>
            <p>By checking ✅ I Agree, you confirm:</p>
            <ul>
              <li>You are 18+ (or have parental consent).</li>
              <li>You read and accept all terms.</li>
              <li>You waive class-action lawsuits (arbitration only).</li>
            </ul>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      
      // Trigger print dialog which allows saving as PDF
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onDecline}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">Terms of Service & Privacy Policy</DialogTitle>
              <p className="text-muted-foreground">Please review and accept our terms to continue</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6 pb-4">
              <div className="space-y-6">
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
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">2.1 Age Requirement</h3>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>You must be at least 18 years old to use the Platform.</li>
                        <li>In jurisdictions where the legal age of consent differs, you must comply with local laws.</li>
                        <li>We do not knowingly allow underage users and will terminate accounts and report illegal activity if discovered.</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-2">2.2 Account Security</h3>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
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
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">3.1 Permitted Use</h3>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>The Platform is for legally permissible content (e.g., artistic, educational, or adult content where allowed).</li>
                        <li>Users must comply with all applicable laws (local, national, and international).</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-2">3.2 Prohibited Content & Behavior</h3>
                      <p className="mb-2 text-sm">You may not use the Platform to:</p>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Post illegal content (child exploitation, revenge porn, terrorism-related material).</li>
                        <li>Engage in fraud, phishing, or scams.</li>
                        <li>Harass, dox, or threaten others.</li>
                        <li>Distribute malware, spam, or pirated material.</li>
                        <li>Circumvent payment systems (e.g., chargebacks, off-platform transactions).</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-2">3.3 Content Ownership & Licensing</h3>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Creators retain ownership of their content but grant the Platform a non-exclusive license to distribute it.</li>
                        <li>Fans may not redistribute paid content without permission.</li>
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
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">4.1 Subscription & Tipping</h3>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Fans pay creators directly, and the Platform deducts a service fee.</li>
                        <li>Recurring subscriptions auto-renew unless canceled.</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-2">4.2 Refund Policy</h3>
                      <div className="space-y-2 text-sm">
                        <p>No refunds for voluntary transactions.</p>
                        <p><strong>Exceptions:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Unauthorized payments (report within 7 days).</li>
                          <li>Undelivered content (after 14 days of non-delivery).</li>
                        </ul>
                        <p>Chargebacks will result in account suspension.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Copyright & DMCA */}
                <Card>
                  <CardHeader>
                    <CardTitle>5. Copyright & DMCA Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">5.1 Copyright Infringement Claims</h3>
                      <div className="space-y-3 text-sm">
                        <p>We comply with the Digital Millennium Copyright Act (DMCA).</p>
                        <p>To file a takedown request, submit:</p>
                        <ul className="list-disc pl-6 space-y-1">
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
                      <h3 className="text-lg font-semibold mb-2">5.2 Counter-Notification</h3>
                      <p className="text-sm">If content is wrongly removed, you may submit a counter-notice under penalty of perjury.</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Termination */}
                <Card>
                  <CardHeader>
                    <CardTitle>6. Termination & Suspension</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
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
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><strong>Arbitration Clause:</strong> Disputes must be resolved via binding arbitration (not class action).</li>
                      <li><strong>Governing Law:</strong> These terms are governed by United States law.</li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Privacy Policy Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>8. Privacy Policy (Detailed Breakdown)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">8.1 Data Collected</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-border text-sm">
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
                              <td className="border border-border p-3">Card details (via Stripe/PayPal)</td>
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
                      <h3 className="text-lg font-semibold mb-2">8.2 How We Use Data</h3>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>To provide services (payments, moderation).</li>
                        <li>To improve the Platform (bug fixes, UX enhancements).</li>
                        <li>For legal compliance (fraud prevention, subpoenas).</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-2">8.3 Data Sharing & Third Parties</h3>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Creators see fan interactions (tips, subscriptions).</li>
                        <li>Payment processors (Stripe, PayPal) handle transactions.</li>
                        <li>Cloud providers (AWS, Google Cloud) store data securely.</li>
                        <li>Legal authorities (if required by law).</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-2">8.4 User Rights (GDPR/CCPA)</h3>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li><strong>Access/Delete Data:</strong> Email support@fanrealms.com</li>
                        <li><strong>Opt-Out (CCPA):</strong> Contact us for data deletion requests</li>
                        <li><strong>EU Users:</strong> Withdraw consent anytime</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-2">8.5 Data Retention & Security</h3>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>We retain data as long as necessary (or per legal requirements).</li>
                        <li>Encryption & firewalls protect sensitive data.</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Final Consent */}
                <Card className="border-2 border-primary">
                  <CardHeader>
                    <CardTitle>9. Final Consent & Agreement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="font-medium text-sm">By checking ✅ I Agree, you confirm:</p>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>You are 18+ (or have parental consent).</li>
                        <li>You read and accept all terms.</li>
                        <li>You waive class-action lawsuits (arbitration only).</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="p-6 pt-4 border-t shrink-0">
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="final-agreement"
                  checked={finalAgreement}
                  onCheckedChange={(checked) => setFinalAgreement(!!checked)}
                />
                <label htmlFor="final-agreement" className="text-lg font-semibold cursor-pointer flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  I Agree to All Terms
                </label>
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={handleAcceptContinue}
              className="w-full"
            >
              Accept & Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
