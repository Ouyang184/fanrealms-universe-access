
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface CreatorTermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export function CreatorTermsModal({ open, onOpenChange, onAccept }: CreatorTermsModalProps) {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleAccept = () => {
    if (!hasAccepted) {
      setShowError(true);
      return;
    }
    onAccept();
    setHasAccepted(false);
    setShowError(false);
  };

  const handleDecline = () => {
    onOpenChange(false);
    setHasAccepted(false);
    setShowError(false);
  };

  const handleCheckboxChange = (checked: boolean) => {
    setHasAccepted(checked);
    if (checked) {
      setShowError(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Creator Terms of Service</DialogTitle>
          <DialogDescription>
            Please read and accept our Creator Terms of Service to continue.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <div className="text-right text-muted-foreground">
              Last Updated: {new Date().toLocaleDateString()}
            </div>

            <section>
              <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
              <p>By registering as a Creator on FanRealms, you agree to these legally binding terms.</p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Eligibility</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Must be 18+ (or legal age in your jurisdiction).</li>
                <li>Must pass identity verification (ID, tax forms, bank details).</li>
                <li>Prohibited if previously banned or on sanctions lists.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Content Rules</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-green-600 mb-1">Allowed:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Original content (art, music, writing, adult where legal).</li>
                    <li>Paywalled exclusives (subscriptions, tips).</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-600 mb-1">Prohibited:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Illegal material (CSAM, revenge porn, terrorism).</li>
                    <li>Copyright infringement (no piracy).</li>
                    <li>Harassment, hate speech, or payment circumvention.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Payments & Fees</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Platform fee: 5% of earnings.</li>
                <li>Payouts every 7 days via Stripe.</li>
                <li>You handle chargebacks/taxes. Excessive disputes = ban.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Intellectual Property</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>You retain ownership but grant us a hosting license.</li>
                <li>DMCA Compliance: We remove infringing content; repeat offenders banned.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Termination</h3>
              <p className="mb-2">We may ban you for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Illegal activity.</li>
                <li>Fraud (fake accounts, scams).</li>
                <li>3+ copyright strikes.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Legal Protections</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Arbitration required (no class actions).</li>
                <li>Governing law: United States.</li>
                <li>We may update terms with 30 days' notice.</li>
              </ul>
            </section>

            <section className="border-t pt-4">
              <h3 className="font-semibold text-base mb-2">Final Consent</h3>
              <p className="mb-2">By checking below, you confirm:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You are 18+ and legally authorized to monetize content.</li>
                <li>You accept all terms above.</li>
              </ul>
            </section>
          </div>
        </ScrollArea>

        {showError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You must accept the Creator Terms of Service to continue.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center space-x-2 py-2">
          <Checkbox 
            id="terms-agreement" 
            checked={hasAccepted}
            onCheckedChange={handleCheckboxChange}
          />
          <label 
            htmlFor="terms-agreement" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            ✅ I Agree to All Terms
          </label>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button variant="outline" onClick={handleDecline}>
            ❌ I Do Not Agree (Exit)
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={!hasAccepted}
            className="gap-2"
          >
            Continue as Creator
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
