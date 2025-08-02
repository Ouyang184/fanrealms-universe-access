import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MFAEnrollment } from "@/components/auth/MFAEnrollment";
import { useMFA } from "@/hooks/useMFA";
import LoadingSpinner from "@/components/LoadingSpinner";

const Settings2FA = () => {
  const navigate = useNavigate();
  const { factors, isLoading, fetchFactors, unenrollFactor, hasMFA } = useMFA();
  const [showEnrollment, setShowEnrollment] = useState(false);

  const handleEnrollmentComplete = () => {
    setShowEnrollment(false);
    fetchFactors();
  };

  const handleUnenroll = async (factorId: string) => {
    await unenrollFactor(factorId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (showEnrollment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <MFAEnrollment
          onEnrollmentComplete={handleEnrollmentComplete}
          onCancel={() => setShowEnrollment(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Two-Factor Authentication
            </h1>
            <p className="text-muted-foreground">
              Secure your account with an additional layer of protection
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>
              Current security status of your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className={`h-5 w-5 ${hasMFA ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <p className="font-medium">
                    Two-Factor Authentication
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasMFA ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              <Badge variant={hasMFA ? 'default' : 'secondary'}>
                {hasMFA ? 'Secure' : 'Standard'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {!hasMFA && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your account is not protected by two-factor authentication. We recommend enabling 2FA to secure your account.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Authenticator Apps</CardTitle>
            <CardDescription>
              Manage your TOTP authenticator applications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {factors.length === 0 ? (
              <div className="text-center py-6">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No authenticator apps configured
                </p>
                <Button onClick={() => setShowEnrollment(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Authenticator App
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {factors.map((factor) => (
                  <div
                    key={factor.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{factor.friendly_name || 'Authenticator App'}</p>
                        <p className="text-sm text-muted-foreground">
                          {(factor.factor_type || 'TOTP').toUpperCase()} • {factor.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={factor.status === 'verified' ? 'default' : 'secondary'}
                      >
                        {factor.status}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Authenticator</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this authenticator? This action cannot be undone and will disable 2FA on your account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleUnenroll(factor.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => setShowEnrollment(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Authenticator
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recovery Options</CardTitle>
            <CardDescription>
              Important information about account recovery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Make sure to save your recovery codes in a safe place. If you lose access to your authenticator app, you'll need these codes to regain access to your account.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings2FA;