
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink } from "lucide-react";

interface TermsOfServiceModalProps {
  children: React.ReactNode;
}

export function TermsOfServiceModal({ children }: TermsOfServiceModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Terms of Service & Privacy Policy
            <ExternalLink className="h-5 w-5" />
          </DialogTitle>
          <DialogDescription>
            Last Updated: {new Date().toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Introduction & Acceptance of Terms</h3>
              <p>
                By accessing or using FanRealms ("the Platform"), you agree to comply with these Terms of Service (ToS) and our Privacy Policy. If you do not agree, you must immediately cease using the Platform.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Eligibility & Account Registration</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">2.1 Age Requirement</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>You must be at least 18 years of age to create NSFW content.</li>
                    <li>In jurisdictions where the legal age of consent differs, you must comply with local laws.</li>
                    <li>We do not knowingly allow underage users and will terminate accounts and report illegal activity if discovered.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">2.2 Account Security & Multiple Accounts</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>You are responsible for maintaining confidential login credentials.</li>
                    <li>You must notify us immediately of unauthorized access.</li>
                    <li>Multiple accounts from the same IP address or location are permitted.</li>
                    <li>Each account must have a unique email address.</li>
                    <li>We reserve the right to suspend or terminate accounts suspected of fraudulent activity.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. User Responsibilities & Prohibited Conduct</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">3.1 Permitted Use</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>The Platform is for legally permissible content (e.g., artistic, educational, or adult content where allowed).</li>
                    <li>Users must comply with all applicable laws (local, national, and international).</li>
                    <li>Users may create multiple accounts with different email addresses.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">3.2 Prohibited Content & Behavior</h4>
                  <p className="mb-2">You may not use the Platform to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Post inappropriate content (child exploitation, revenge porn, terrorism-related material), if any inappropriate content are reported, it will be immediately deleted.</li>
                    <li>Engage in fraud, phishing, or scams.</li>
                    <li>Harass, dox, or threaten others.</li>
                    <li>Distribute malware, spam, or pirated material.</li>
                    <li>Circumvent payment systems (e.g., chargebacks, off-platform transactions).</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Payments, Fees & Refunds</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">4.1 Subscription & Tipping</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Subscribers pay creators by the use of stripe, stripe and the Platform deducts a service fee.</li>
                    <li>Recurring subscriptions auto-renew unless canceled.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">4.2 Refund Policy</h4>
                  <div className="space-y-2">
                    <p>No refunds for voluntary transactions.</p>
                    <p><strong>Exceptions:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Unauthorized payments (report within 7 days).</li>
                      <li>Undelivered content (after 14 days of non-delivery).</li>
                    </ul>
                    <p>Chargebacks will result in account suspension.</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Content Ownership & Licensing</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Creators retain ownership of their content but grant the Platform a non-exclusive license to distribute it.</li>
                <li>Subscribers may not redistribute paid content without permission.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Privacy Policy</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>We collect and process personal information as described in our Privacy Policy.</li>
                <li>We use industry-standard security measures to protect your data.</li>
                <li>We may share information as required by law or to protect our rights.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Termination</h3>
              <p className="mb-2">We may terminate accounts for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Illegal activity</li>
                <li>Fraud (fake accounts, scams)</li>
                <li>3+ copyright strikes</li>
                <li>Violation of these terms</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Legal Protections</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Arbitration required (no class actions)</li>
                <li>Governing law: United States</li>
                <li>We may update terms with 30 days' notice</li>
              </ul>
            </section>
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
