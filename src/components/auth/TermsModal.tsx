
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
            <h2>5. Privacy Policy Summary</h2>
            <h3>5.1 Data We Collect</h3>
            <ul>
              <li>Account information (email, username, age verification)</li>
              <li>Payment data (processed via secure third parties)</li>
              <li>Content and usage data</li>
              <li>Device and analytics information</li>
            </ul>
            
            <h3>5.2 Your Rights</h3>
            <ul>
              <li>Access and delete your data</li>
              <li>Opt-out of data processing (where applicable)</li>
              <li>Withdraw consent at any time</li>
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

                {/* Privacy Policy Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>5. Privacy Policy Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">5.1 Data We Collect</h3>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Account information (email, username, age verification)</li>
                        <li>Payment data (processed via secure third parties)</li>
                        <li>Content and usage data</li>
                        <li>Device and analytics information</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-2">5.2 Your Rights</h3>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Access and delete your data</li>
                        <li>Opt-out of data processing (where applicable)</li>
                        <li>Withdraw consent at any time</li>
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
