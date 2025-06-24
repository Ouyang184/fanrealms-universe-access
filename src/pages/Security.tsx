
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Server, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function Security() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Security & Protection
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Your safety and security are our top priorities. Learn how we protect FanRealms with enterprise-grade security measures.
          </p>
        </div>

        {/* Cloudflare Protection */}
        <Card className="mb-8 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-orange-600" />
              Cloudflare Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg leading-relaxed">
                FanRealms is protected by <strong>Cloudflare</strong>, one of the world's largest and most trusted security networks. 
                Cloudflare operates in over 320 cities worldwide, providing comprehensive protection against cyber threats.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">DDoS Protection</h4>
                    <p className="text-sm text-muted-foreground">Automatic protection against distributed denial-of-service attacks</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Web Application Firewall</h4>
                    <p className="text-sm text-muted-foreground">Blocks malicious traffic and protects against common exploits</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">SSL/TLS Encryption</h4>
                    <p className="text-sm text-muted-foreground">All data in transit is encrypted with the latest TLS protocols</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Bot Protection</h4>
                    <p className="text-sm text-muted-foreground">Advanced bot detection prevents automated attacks and spam</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Protection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-blue-600" />
              Data Protection & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">End-to-End Encryption</h4>
                <p className="text-muted-foreground">
                  All sensitive data is encrypted using AES-256 encryption standards, both during transmission and storage.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Zero-Knowledge Architecture</h4>
                <p className="text-muted-foreground">
                  Your private content and personal data are encrypted in a way that even FanRealms cannot access them without your permission.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Regular Security Audits</h4>
                <p className="text-muted-foreground">
                  We conduct regular third-party security audits and penetration testing to identify and fix potential vulnerabilities.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">GDPR & CCPA Compliance</h4>
                <p className="text-muted-foreground">
                  We fully comply with international privacy regulations including GDPR, CCPA, and other data protection laws.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Security */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-purple-600" />
              Content Security & Moderation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Automated Content Scanning</h4>
                <p className="text-muted-foreground">
                  AI-powered systems automatically scan uploaded content for prohibited material and potential security threats.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Digital Watermarking</h4>
                <p className="text-muted-foreground">
                  Premium content is protected with invisible watermarks to prevent unauthorized distribution.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Access Control</h4>
                <p className="text-muted-foreground">
                  Sophisticated access controls ensure only authorized subscribers can view premium content.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">DMCA Protection</h4>
                <p className="text-muted-foreground">
                  Rapid response system for copyright infringement claims and takedown requests.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Infrastructure Security */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Server className="w-6 h-6 text-green-600" />
              Infrastructure Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Supabase Backend</h4>
                <p className="text-muted-foreground">
                  Built on Supabase's secure, enterprise-grade PostgreSQL database with row-level security and real-time capabilities.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Multi-Region Redundancy</h4>
                <p className="text-muted-foreground">
                  Data is replicated across multiple geographic regions to ensure availability and disaster recovery.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Automated Backups</h4>
                <p className="text-muted-foreground">
                  Regular automated backups ensure your data is never lost, with point-in-time recovery capabilities.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">24/7 Monitoring</h4>
                <p className="text-muted-foreground">
                  Continuous monitoring of all systems with real-time alerts for any security incidents or anomalies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Best Practices */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600" />
              Your Security Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground mb-4">
                Help us keep your account secure by following these best practices:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium">Use Strong Passwords</h5>
                    <p className="text-sm text-muted-foreground">Create unique, complex passwords for your account</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium">Enable Two-Factor Authentication</h5>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your login</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium">Keep Software Updated</h5>
                    <p className="text-sm text-muted-foreground">Use the latest browser and operating system versions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium">Be Cautious with Links</h5>
                    <p className="text-sm text-muted-foreground">Always verify emails and links before clicking</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Security Team */}
        <Card>
          <CardHeader>
            <CardTitle>Report Security Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              If you discover a security vulnerability or have concerns about your account security, 
              please contact our security team immediately.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" asChild>
                <a href="mailto:security@fanrealms.com">Report Security Issue</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://www.cloudflare.com/security/" target="_blank" rel="noopener noreferrer">
                  Learn More About Cloudflare Security
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
