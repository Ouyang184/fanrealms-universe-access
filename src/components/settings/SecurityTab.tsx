import { Shield, Key, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useMFA } from "@/hooks/useMFA";

export function SecurityTab() {
  const { hasMFA, isLoading } = useMFA();

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
                <Shield className={`h-5 w-5 ${hasMFA ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={hasMFA ? 'default' : 'secondary'}>
                  {isLoading ? 'Loading...' : hasMFA ? 'Enabled' : 'Disabled'}
                </Badge>
                <Link to="/settings/2fa">
                  <Button variant="outline" size="sm">
                    {hasMFA ? 'Manage' : 'Set up'}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
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
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Enable Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {hasMFA 
                    ? "✓ Great! You have 2FA enabled on your account."
                    : "Add an authenticator app to secure your account with 2FA."
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