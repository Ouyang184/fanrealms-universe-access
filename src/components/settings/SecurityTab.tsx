import { useState } from "react";
import { Shield, Key, ArrowRight, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { EmailMFASetup } from "@/components/auth/EmailMFASetup";
import { useAuth } from "@/contexts/AuthContext";

export function SecurityTab() {
  const { user } = useAuth();
  const [showMFADialog, setShowMFADialog] = useState(false);
  
  // Check if email 2FA is enabled from user metadata
  const hasEmail2FA = user?.user_metadata?.email_2fa_enabled === true;

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
                <Mail className={`h-5 w-5 ${hasEmail2FA ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <p className="font-medium">Email Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Receive verification codes via email when signing in
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={hasEmail2FA ? 'default' : 'secondary'}>
                  {hasEmail2FA ? 'Enabled' : 'Disabled'}
                </Badge>
                <Dialog open={showMFADialog} onOpenChange={setShowMFADialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      {hasEmail2FA ? 'Manage' : 'Set up'}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <EmailMFASetup />
                  </DialogContent>
                </Dialog>
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
              <Mail className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Enable Email Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {hasEmail2FA 
                    ? "✓ Great! You have email 2FA enabled on your account."
                    : "Add email verification codes to secure your account with 2FA."
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
    </div>
  );
}