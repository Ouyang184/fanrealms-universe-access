
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Users, Shield, CreditCard } from 'lucide-react';

export function TermsContent() {
  return (
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
            <h3 className="text-lg font-semibold mb-3">2.2 Account Security & Multiple Accounts</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are responsible for maintaining confidential login credentials.</li>
              <li>You must notify us immediately of unauthorized access.</li>
              <li>Multiple accounts from the same IP address or location are permitted.</li>
              <li>Each account must have a unique email address.</li>
              <li>We reserve the right to suspend or terminate accounts suspected of fraudulent activity.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

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
              <li>Users may create multiple accounts with different email addresses.</li>
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

      {/* Additional terms sections would continue here */}
    </div>
  );
}
