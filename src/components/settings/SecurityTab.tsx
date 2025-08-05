import { useState } from "react";
import { Shield, Key, ArrowRight, Smartphone, X, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { MFAEnrollment } from "@/components/auth/MFAEnrollment";
import { MFAChallenge } from "@/components/auth/MFAChallenge";
import { EmailMFASetup } from "@/components/auth/EmailMFASetup";
import { useAuth } from "@/contexts/AuthContext";
import { useMFA } from "@/hooks/useMFA";
import { useEmailMFA } from "@/hooks/useEmailMFA";
import { useToast } from "@/hooks/use-toast";

export function SecurityTab() {
  const { user } = useAuth();
  const { factors, hasMFA, fetchFactors, unenrollFactor } = useMFA();
  const { isEnabled: emailMFAEnabled, isLoading: emailMFALoading, enableEmailMFA, disableEmailMFA } = useEmailMFA();
  const { toast } = useToast();
  const [showMFADialog, setShowMFADialog] = useState(false);
  const [showEmailMFADialog, setShowEmailMFADialog] = useState(false);
  const [managingFactor, setManagingFactor] = useState<string | null>(null);
  const [managingEmailMFA, setManagingEmailMFA] = useState(false);

  const handleEnrollmentComplete = () => {
    setShowMFADialog(false);
    fetchFactors();
    toast({
      title: "MFA Enabled",
      description: "Two-factor authentication has been successfully enabled for your account.",
    });
  };

  const handleEnrollmentCancel = () => {
    setShowMFADialog(false);
  };

  const handleUnenrollFactor = async (factorId: string) => {
    try {
      await unenrollFactor(factorId);
      setManagingFactor(null);
      fetchFactors();
      toast({
        title: "MFA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disable MFA",
        variant: "destructive",
      });
    }
  };

  const handleDisableEmailMFA = async () => {
    try {
      await disableEmailMFA();
      setManagingEmailMFA(false);
      toast({
        title: "Email 2FA Disabled",
        description: "Email two-factor authentication has been disabled for your account.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disable Email 2FA",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </CardTitle>
          <CardDescription>
            Manage your account security settings and authentication methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className={`h-5 w-5 ${emailMFAEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <p className="font-medium">Email Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Receive verification codes via email when signing in
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={emailMFAEnabled ? 'default' : 'secondary'}>
                  {emailMFAEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
                {emailMFAEnabled ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setManagingEmailMFA(true)}
                  >
                    Manage
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Dialog open={showEmailMFADialog} onOpenChange={setShowEmailMFADialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Set up
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <EmailMFASetup />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className={`h-5 w-5 ${hasMFA ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <p className="font-medium">Authenticator App (TOTP)</p>
                  <p className="text-sm text-muted-foreground">
                    Use an authenticator app to generate secure verification codes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={hasMFA ? 'default' : 'secondary'}>
                  {hasMFA ? 'Enabled' : 'Disabled'}
                </Badge>
                {hasMFA ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setManagingFactor(factors[0]?.id || null)}
                  >
                    Manage
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Dialog open={showMFADialog} onOpenChange={setShowMFADialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Set up
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <MFAEnrollment 
                        onEnrollmentComplete={handleEnrollmentComplete}
                        onCancel={handleEnrollmentCancel}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    Change your account password
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Change Password
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
          <CardDescription>
            Follow these recommendations to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Enable Authenticator App (TOTP)</p>
                <p className="text-sm text-muted-foreground">
                  {hasMFA 
                    ? "✓ Great! You have TOTP authentication enabled on your account."
                    : "Add an authenticator app like Google Authenticator to secure your account with 2FA."
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">Use a Strong Password</p>
                <p className="text-sm text-muted-foreground">
                  Use a unique password that's at least 12 characters long with a mix of letters, numbers, and symbols.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium">Keep Your Account Safe</p>
                <p className="text-sm text-muted-foreground">
                  Never share your login credentials and always log out from public computers.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TOTP MFA Management Dialog */}
      {managingFactor && (
        <Dialog open={!!managingFactor} onOpenChange={() => setManagingFactor(null)}>
          <DialogContent className="max-w-md">
            <div className="space-y-4">
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold">Disable Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to disable TOTP authentication? This will make your account less secure.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setManagingFactor(null)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => handleUnenrollFactor(managingFactor)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Disable MFA
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Email MFA Management Dialog */}
      {managingEmailMFA && (
        <Dialog open={managingEmailMFA} onOpenChange={() => setManagingEmailMFA(false)}>
          <DialogContent className="max-w-md">
            <div className="space-y-4">
              <div className="text-center">
                <Mail className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold">Disable Email Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to disable email 2FA? This will make your account less secure.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setManagingEmailMFA(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={handleDisableEmailMFA}
                  disabled={emailMFALoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  {emailMFALoading ? "Disabling..." : "Disable Email 2FA"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}